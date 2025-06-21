const express = require('express');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const app = express();
const port = 3000;
const dotenv = require('dotenv');
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

dotenv.config();

app.use(express.json());
app.use(express.static('public'));

// Gemini API key
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// Helper to call Gemini
async function callGeminiAPI(prompt) {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }]
      })
    }
  );

  const data = await response.json();

  if (!response.ok || !data.candidates) {
    console.error('Gemini API error:', data);
    throw new Error('Failed to generate content from Gemini API');
  }

  return data.candidates[0].content.parts[0].text;
}

// 1️⃣ Route to generate text only (for preview)
app.post('/generate-cover-letter-text', async (req, res) => {
  console.log('✅ Request received:', req.body);

  const { name, phone, email, linkedin, date, jobTitle, companyName, hiringManager, jobSource } = req.body;

  let prompt = `Generate a professional cover letter based on the following details:\n`;

  if (name) prompt += `Name: ${name}\n`;
  if (phone) prompt += `Phone: ${phone}\n`;
  if (email) prompt += `Email: ${email}\n`;
  if (linkedin) prompt += `LinkedIn: ${linkedin}\n`;
  if (date) prompt += `Date: ${date}\n`;
  if (jobTitle) prompt += `Job Title: ${jobTitle}\n`;
  if (companyName) prompt += `Company Name: ${companyName}\n`;
  if (hiringManager) prompt += `Hiring Manager: ${hiringManager}\n`;
  if (jobSource) prompt += `Job Source: ${jobSource}\n`;

  prompt += `\nUse a clean and professional format. DO NOT include a subject line. Use bullet points for a central paragraph higlighing relevant skills and experience as per the job description. Remove brackets, asterisks, or unnecessary formatting. Exclude company's name and adress information at top. And use '-' instead of '*' for bullets.`;

  try {
    const content = await callGeminiAPI(prompt);
    console.log('🧠 Gemini response:\n', content.slice(0, 300), '...\n');
    res.json({ content });
  } catch (err) {
    console.error('❌ Gemini error:', err);
    res.status(500).json({ error: 'Failed to generate cover letter text' });
  }
});

// 2️⃣ Route to generate PDF from submitted text
app.post('/download-pdf', (req, res) => {
  const { content } = req.body;
  if (!content) return res.status(400).json({ error: 'No content to generate PDF' });

  const doc = new PDFDocument();
  const pdfPath = `cover-letter-${Date.now()}.pdf`;
  const stream = fs.createWriteStream(pdfPath);
  doc.pipe(stream);

  doc.fillColor('#000');
  doc.fontSize(12);

  const lines = content.split('\n');
  lines.forEach(line => {
    if (line.trim()) {
      doc.text(line.trim(), { align: 'left' });
    } else {
      doc.moveDown();
    }
  });

  doc.end();

  stream.on('finish', () => {
    console.log('📄 Sending generated PDF...');
    res.download(pdfPath, 'cover-letter.pdf', (err) => {
      if (err) {
        console.error('❌ Download error:', err);
        res.status(500).json({ error: 'PDF download failed' });
      }
      fs.unlinkSync(pdfPath); // Clean up after sending
    });
  });
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
