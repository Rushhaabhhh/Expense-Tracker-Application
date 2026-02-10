const { validationResult } = require('express-validator');
const chatService = require('../services/chatService');

exports.chat = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { message } = req.body;
    const userId = req.user._id;

    console.log(`Chat request from user ${userId}: "${message.substring(0, 50)}..."`);

    // Get response from chatService
    const reply = await chatService.chat(userId, message);

    res.json({
      message,
      reply,
      timestamp: new Date()
    });
  } catch (error) {
    console.error('Chat controller error:', error);
    res.status(500).json({ 
      message: 'Error processing chat request',
      reply: 'Sorry, I encountered an error. Please try again.'
    });
  }
};
