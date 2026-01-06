console.log('🚀 Popup script loading...');

let allExtractedContacts = [];
let isExtracting = false;

document.addEventListener('DOMContentLoaded', function() {
  console.log('✅ DOM loaded');
  
  const extractBtn = document.getElementById('extractBtn');
  const downloadBtn = document.getElementById('downloadBtn');
  const statusDiv = document.getElementById('status');
  const resultsDiv = document.getElementById('results');
  const contactCountSpan = document.getElementById('contactCount');
  const pageCountSpan = document.getElementById('pageCount');
  const contactListDiv = document.getElementById('contactList');
  const pageLimitInput = document.getElementById('pageLimit');
  const progressDiv = document.getElementById('progress');
  const progressBar = document.getElementById('progressBar');
  const progressText = document.getElementById('progressText');
  
  const incrementBtn = document.querySelector('.increment');
  const decrementBtn = document.querySelector('.decrement');
  const quickBtns = document.querySelectorAll('.quick-btn');
  
  console.log('✅ All elements found');
  
  checkCurrentTab();
  updateQuickButtons();
  
  // Input controls
  if (incrementBtn) {
    incrementBtn.addEventListener('click', function(e) {
      e.preventDefault();
      const val = parseInt(pageLimitInput.value) || 0;
      if (val < 100) {
        pageLimitInput.value = val + 1;
        updateQuickButtons();
      }
    });
  }
  
  if (decrementBtn) {
    decrementBtn.addEventListener('click', function(e) {
      e.preventDefault();
      const val = parseInt(pageLimitInput.value) || 0;
      if (val > 0) {
        pageLimitInput.value = val - 1;
        updateQuickButtons();
      }
    });
  }
  
  quickBtns.forEach(btn => {
    btn.addEventListener('click', function(e) {
      e.preventDefault();
      const value = this.getAttribute('data-value');
      pageLimitInput.value = value;
      updateQuickButtons();
    });
  });
  
  if (pageLimitInput) {
    pageLimitInput.addEventListener('input', updateQuickButtons);
  }
  
  if (extractBtn) {
    extractBtn.addEventListener('click', function(e) {
      e.preventDefault();
      handleExtract();
    });
  }
  
  if (downloadBtn) {
    downloadBtn.addEventListener('click', function(e) {
      e.preventDefault();
      if (allExtractedContacts.length > 0) {
        downloadAsExcel(allExtractedContacts);
      }
    });
  }
  
  chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    console.log('📨 Message received:', request.action);
    
    if (request.action === 'updateProgress') {
      if (progressBar) progressBar.style.width = request.progress + '%';
      if (progressText) progressText.textContent = request.message;
    } 
    else if (request.action === 'pageComplete') {
      allExtractedContacts = request.contacts;
      displayResults(allExtractedContacts, request.pageNumber);
    } 
    else if (request.action === 'extractionComplete') {
      if (progressDiv) progressDiv.style.display = 'none';
      if (extractBtn) {
        extractBtn.disabled = false;
        extractBtn.innerHTML = '<span class="btn-icon">⚡</span> Extract Contacts';
      }
      isExtracting = false;
      
      if (allExtractedContacts.length > 0) {
        showStatus('success', `Extracted ${allExtractedContacts.length} contacts from ${request.totalPages} page(s)`);
        if (downloadBtn) downloadBtn.disabled = false;
      } else {
        showStatus('warning', 'No contacts found');
        if (downloadBtn) downloadBtn.disabled = true;
      }
    }
  });
  
  function updateQuickButtons() {
    const currentValue = pageLimitInput.value;
    quickBtns.forEach(btn => {
      if (btn.getAttribute('data-value') === currentValue) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
  }
  
  async function checkCurrentTab() {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      if (!tab.url || !tab.url.includes('linkedin.com')) {
        if (extractBtn) {
          extractBtn.disabled = true;
          extractBtn.innerHTML = '🚫 Go to LinkedIn';
        }
        showStatus('warning', 'Please navigate to LinkedIn search results');
      } else {
        if (extractBtn) {
          extractBtn.disabled = false;
          extractBtn.innerHTML = '<span class="btn-icon">⚡</span> Extract Contacts';
        }
        hideStatus();
      }
    } catch (error) {
      console.error('Tab check error:', error);
    }
  }
  
  function showStatus(type, message) {
    if (!statusDiv) return;
    
    statusDiv.className = 'status ' + type;
    let icon = '📌';
    if (type === 'success') icon = '✅';
    if (type === 'error') icon = '❌';
    if (type === 'warning') icon = '⚠️';
    
    statusDiv.innerHTML = '<div class="status-icon">' + icon + '</div><div class="status-content">' + message + '</div>';
    statusDiv.style.display = 'flex';
  }
  
  function hideStatus() {
    if (statusDiv) statusDiv.style.display = 'none';
  }
  
  async function handleExtract() {
    if (isExtracting) return;
    
    isExtracting = true;
    allExtractedContacts = [];
    
    hideStatus();
    if (resultsDiv) resultsDiv.style.display = 'none';
    if (progressDiv) progressDiv.style.display = 'block';
    if (progressBar) progressBar.style.width = '0%';
    if (progressText) progressText.textContent = 'Starting...';
    
    if (extractBtn) {
      extractBtn.disabled = true;
      extractBtn.innerHTML = '<span class="btn-icon">⏳</span> Extracting...';
    }
    
    const pageLimit = parseInt(pageLimitInput.value) || 0;
    
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      if (!tab.url || !tab.url.includes('linkedin.com')) {
        throw new Error('Not on LinkedIn');
      }
      
      try {
        await chrome.tabs.sendMessage(tab.id, { action: 'ping' });
      } catch (e) {
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          files: ['content.js']
        });
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
      
      chrome.tabs.sendMessage(
        tab.id,
        { action: 'extractMultiplePages', pageLimit: pageLimit },
        function(response) {
          if (chrome.runtime.lastError) {
            console.error('❌ Runtime error:', chrome.runtime.lastError);
            handleError(chrome.runtime.lastError.message);
            return;
          }
        }
      );
      
    } catch (error) {
      console.error('❌ Extract error:', error);
      handleError(error.message);
    }
  }
  
  function handleError(message) {
    if (progressDiv) progressDiv.style.display = 'none';
    showStatus('error', message);
    if (extractBtn) {
      extractBtn.disabled = false;
      extractBtn.innerHTML = '<span class="btn-icon">⚡</span> Extract Contacts';
    }
    isExtracting = false;
  }
  
  function displayResults(contacts, pageNumber) {
    if (contactCountSpan) contactCountSpan.textContent = contacts.length;
    if (pageCountSpan) pageCountSpan.textContent = pageNumber || 1;
    if (contactListDiv) contactListDiv.innerHTML = '';
    
    contacts.forEach((contact, index) => {
      const div = document.createElement('div');
      div.className = 'contact-item';
      
      let html = '<div class="contact-header"><strong>' + (index + 1) + '. ' + escapeHtml(contact.name) + '</strong>';
      if (contact.profileUrl) {
        html += '<a href="' + escapeHtml(contact.profileUrl) + '" target="_blank" class="profile-link">View</a>';
      }
      html += '</div>';
      
      if (contact.jobTitle) html += '<div class="contact-title">💼 ' + escapeHtml(contact.jobTitle) + '</div>';
      if (contact.location) html += '<div class="contact-location">📍 ' + escapeHtml(contact.location) + '</div>';
      if (contact.pastExperience) html += '<div class="contact-past">🏢 ' + escapeHtml(contact.pastExperience) + '</div>';
      if (contact.mutualConnections) html += '<div class="contact-mutual">👥 ' + escapeHtml(contact.mutualConnections) + '</div>';
      if (contact.additionalInfo1) html += '<div class="contact-additional">ℹ️ ' + escapeHtml(contact.additionalInfo1) + '</div>';
      
      div.innerHTML = html;
      if (contactListDiv) contactListDiv.appendChild(div);
    });
    
    if (resultsDiv) resultsDiv.style.display = 'block';
  }
  
  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text || '';
    return div.innerHTML;
  }
  
  function downloadAsExcel(contacts) {
    console.log('📥 Downloading', contacts.length, 'contacts');
    
    const rows = contacts.map((contact, index) => {
      return '<tr>' +
        '<td>' + (index + 1) + '</td>' +
        '<td>' + escapeHtml(contact.name) + '</td>' +
        '<td>' + escapeHtml(contact.jobTitle) + '</td>' +
        '<td>' + escapeHtml(contact.location) + '</td>' +
        '<td>' + escapeHtml(contact.pastExperience) + '</td>' +
        '<td>' + escapeHtml(contact.mutualConnections) + '</td>' +
        '<td>' + escapeHtml(contact.additionalInfo1) + '</td>' +
        '<td>' + escapeHtml(contact.additionalInfo2) + '</td>' +
        '<td><a href="' + escapeHtml(contact.profileUrl) + '">' + escapeHtml(contact.profileUrl) + '</a></td>' +
        '<td>' + (contact.pageNumber || 1) + '</td>' +
        '</tr>';
    }).join('');
    
    const html = '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">' +
      '<head><meta charset="UTF-8"><style>table{border-collapse:collapse}th,td{border:1px solid #ddd;padding:8px;text-align:left}th{background-color:#0077b5;color:white;font-weight:bold}</style></head>' +
      '<body><table><thead><tr>' +
      '<th>#</th><th>Name</th><th>Job Title</th><th>Location</th><th>Past Experience</th><th>Mutual Connections</th><th>Additional Info 1</th><th>Additional Info 2</th><th>Profile URL</th><th>Page</th>' +
      '</tr></thead><tbody>' + rows + '</tbody></table></body></html>';
    
    const blob = new Blob([html], { type: 'application/vnd.ms-excel' });
    const url = URL.createObjectURL(blob);
    const timestamp = new Date().toISOString().slice(0, 19).replace(/[:.]/g, '-');
    const filename = 'linkedin_contacts_' + contacts.length + '_' + timestamp + '.xls';
    
    chrome.downloads.download({
      url: url,
      filename: filename,
      saveAs: true
    }, function() {
      if (chrome.runtime.lastError) {
        showStatus('error', 'Download failed');
      } else {
        showStatus('success', 'Download started!');
      }
      setTimeout(function() { URL.revokeObjectURL(url); }, 5000);
    });
  }
  
  console.log('✅ Popup initialized');
});