async function generateCoverLetter() {
  const name = document.getElementById('name').value.trim();
  const phone = document.getElementById('phone').value.trim();
  const email = document.getElementById('email').value.trim();
  const linkedin = document.getElementById('linkedin').value.trim();
  const jobTitle = document.getElementById('jobTitle').value.trim();
  const companyName = document.getElementById('companyName').value.trim();
  const hiringManager = document.getElementById('hiringManager').value.trim();
  const jobSource = document.getElementById('jobSource').value.trim();
  const date = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

  if (!name || !phone || !email || !jobTitle || !companyName) {
    alert("Please fill all the required fields marked with *");
    return;
  }

   const payload = { name, phone, email, linkedin, date, jobTitle, companyName, hiringManager, jobSource };

  try {
    const response = await fetch('/generate-cover-letter-text', { // Note: separate text-only route
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to generate cover letter');
    }

    const { content } = await response.json();

    // ✅ Show in preview
    const previewContainer = document.getElementById('previewContainer');
    const preview = document.getElementById('preview');
    preview.innerText = content;
    previewContainer.style.display = 'block';

    // ✅ Enable download button
    const downloadBtn = document.getElementById('downloadBtn');
    downloadBtn.disabled = false;

    // Set download handler
    downloadBtn.onclick = async () => {
      const downloadRes = await fetch('/download-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content })
      });

      const blob = await downloadRes.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'cover-letter.pdf';
      a.click();
      URL.revokeObjectURL(url);
    };

  } catch (err) {
    alert(err.message);
    console.error('Error:', err);
  }
}