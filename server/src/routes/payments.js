import express from 'express';
import Stripe from 'stripe';
import db from '../utils/db.js';
import { authenticate } from '../middleware/auth.js';
import logger from '../utils/logger.js';

let stripe = null;

if (process.env.STRIPE_SECRET_KEY && !process.env.STRIPE_SECRET_KEY.includes('your')) {
  stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
}

const router = express.Router();

// POST /api/payments/create-intent - Create Stripe payment intent
router.post('/create-intent', authenticate, async (req, res) => {
  const { documentId } = req.body;
  if (!documentId) {
    return res.status(400).json({ success: false, message: 'Document ID required' });
  }

  const doc = db.prepare('SELECT * FROM documents WHERE id = ? AND user_id = ?').get(documentId, req.user.id);
  if (!doc) return res.status(404).json({ success: false, message: 'Document not found' });
  if (doc.payment_status === 'paid') return res.status(400).json({ success: false, message: 'Already paid' });

  const amount = parseInt(process.env.RESUME_PROCESSING_PRICE) || 2999; // $29.99

  try {
    // Demo mode if no real Stripe key
    if (!process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY.startsWith('sk_test_your')) {
      const demoIntentId = `demo_pi_${Date.now()}`;
      db.prepare('UPDATE documents SET payment_intent_id = ? WHERE id = ?').run(demoIntentId, documentId);
      return res.json({
        success: true,
        clientSecret: 'demo_secret',
        amount,
        demoMode: true,
        message: 'Demo mode: configure Stripe keys for real payments',
      });
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: 'usd',
      metadata: { documentId, userId: req.user.id },
      receipt_email: req.user.email,
      description: `DocRevamp - Resume Enhancement for ${req.user.email}`,
    });

    db.prepare('UPDATE documents SET payment_intent_id = ? WHERE id = ?').run(paymentIntent.id, documentId);

    res.json({ success: true, clientSecret: paymentIntent.client_secret, amount });
  } catch (err) {
    logger.error('Stripe create intent error:', err);
    res.status(500).json({ success: false, message: 'Payment initialization failed' });
  }
});

// POST /api/payments/confirm - Confirm payment (demo mode or after Stripe webhook)
router.post('/confirm', authenticate, async (req, res) => {
  const { documentId, paymentIntentId } = req.body;

  const doc = db.prepare('SELECT * FROM documents WHERE id = ? AND user_id = ?').get(documentId, req.user.id);
  if (!doc) return res.status(404).json({ success: false, message: 'Document not found' });

  try {
    const amount = parseInt(process.env.RESUME_PROCESSING_PRICE) || 2999;
    const isDemoMode = !process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY.startsWith('sk_test_your');

    if (isDemoMode) {
      db.prepare(`
        UPDATE documents SET payment_status = 'paid', amount_paid = ?, status = 'processing', updated_at = unixepoch()
        WHERE id = ?
      `).run(amount, documentId);
      return res.json({ success: true, message: 'Payment confirmed (demo mode)' });
    }

    const intent = await stripe.paymentIntents.retrieve(paymentIntentId);
    if (intent.status !== 'succeeded') {
      return res.status(400).json({ success: false, message: 'Payment not completed' });
    }
    if (intent.metadata.documentId !== documentId || intent.metadata.userId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Payment mismatch' });
    }

    db.prepare(`
      UPDATE documents SET payment_status = 'paid', amount_paid = ?, status = 'processing', updated_at = unixepoch()
      WHERE id = ?
    `).run(intent.amount, documentId);

    res.json({ success: true, message: 'Payment confirmed' });
  } catch (err) {
    logger.error('Payment confirm error:', err);
    res.status(500).json({ success: false, message: 'Payment confirmation failed' });
  }
});

// POST /api/payments/webhook - Stripe webhook
router.post('/webhook', express.raw({ type: 'application/json' }), (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'payment_intent.succeeded') {
    const intent = event.data.object;
    const { documentId } = intent.metadata;
    if (documentId) {
      db.prepare(`
        UPDATE documents SET payment_status = 'paid', amount_paid = ?, status = 'processing', updated_at = unixepoch()
        WHERE id = ? AND payment_status != 'paid'
      `).run(intent.amount, documentId);
      logger.info(`Payment succeeded for document ${documentId}`);
    }
  }

  res.json({ received: true });
});

// GET /api/payments/price - Get current price
router.get('/price', (req, res) => {
  res.json({
    success: true,
    amount: parseInt(process.env.RESUME_PROCESSING_PRICE) || 2999,
    currency: 'usd',
    displayPrice: `$${((parseInt(process.env.RESUME_PROCESSING_PRICE) || 2999) / 100).toFixed(2)}`,
  });
});

export default router;
