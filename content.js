console.log('🚀 LinkedIn Content Script v7.0 - Simplified & Reliable');

const globalProcessedProfiles = new Set();

function extractContactsFromPage() {
  console.log('🔍 Starting simplified contact extraction...');
  const contacts = [];
  
  // Step 1: Find all potential profile containers
  const containers = findProfileContainers();
  console.log('📦 Found', containers.length, 'potential profile containers');
  
  // Step 2: Process each container
  containers.forEach((container, index) => {
    console.log(`\n👤 Processing container ${index + 1}...`);
    
    const contact = extractContactFromProfileContainer(container);
    
    if (contact && contact.name && contact.profileUrl) {
      // Skip duplicates
      if (!globalProcessedProfiles.has(contact.profileUrl)) {
        globalProcessedProfiles.add(contact.profileUrl);
        contacts.push(contact);
        console.log(`✅ Extracted: ${contact.name}`);
      } else {
        console.log(`⚠️ Duplicate: ${contact.name}`);
      }
    } else {
      console.log(`❌ Could not extract valid contact from container ${index + 1}`);
    }
  });
  
  console.log(`\n📊 Final result: ${contacts.length} contacts extracted`);
  return contacts;
}

function findProfileContainers() {
  console.log('🔍 Looking for profile containers...');
  
  const potentialContainers = [];
  
  // Strategy 1: Look for li elements (most common)
  const listItems = document.querySelectorAll('li');
  listItems.forEach(li => {
    if (hasProfileContent(li)) {
      potentialContainers.push(li);
    }
  });
  
  // Strategy 2: Look for divs with result-related classes
  const resultDivs = document.querySelectorAll('div[class*="result"], div[class*="entity"], div[class*="search"]');
  resultDivs.forEach(div => {
    if (hasProfileContent(div) && !potentialContainers.includes(div)) {
      potentialContainers.push(div);
    }
  });
  
  // Strategy 3: Look for any element containing profile links
  const profileLinks = document.querySelectorAll('a[href*="/in/"]');
  profileLinks.forEach(link => {
    const container = findContainerForLink(link);
    if (container && !potentialContainers.includes(container) && hasProfileContent(container)) {
      potentialContainers.push(container);
    }
  });
  
  console.log(`📋 Found ${potentialContainers.length} potential containers`);
  return potentialContainers;
}

function hasProfileContent(element) {
  // Check if element has profile-related content
  const hasProfileLink = element.querySelector('a[href*="/in/"]');
  const hasProfileImage = element.querySelector('img[alt*=" "], img[src*="profile"]');
  const textContent = element.textContent.trim();
  
  return hasProfileLink && textContent.length > 20 && textContent.length < 2000;
}

function findContainerForLink(link) {
  let current = link;
  
  // Go up the DOM tree to find a suitable container
  for (let i = 0; i < 10; i++) {
    current = current.parentElement;
    if (!current) break;
    
    // Look for container characteristics
    const rect = current.getBoundingClientRect();
    
    if ((current.tagName === 'LI' || 
         current.className.includes('result') || 
         current.className.includes('entity') ||
         (rect.height > 80 && rect.height < 600)) &&
        current.querySelectorAll('a[href*="/in/"]').length <= 10) { // Not too many links
      return current;
    }
  }
  
  return null;
}

function extractContactFromProfileContainer(container) {
  console.log('  📝 Extracting contact info...');
  
  // Find the main profile link
  const mainProfileLink = findMainProfileLink(container);
  
  if (!mainProfileLink) {
    console.log('  ❌ No main profile link found');
    return null;
  }
  
  const name = mainProfileLink.textContent.trim();
  const profileUrl = mainProfileLink.href.split('?')[0];
  
  console.log(`  👤 Name: ${name}`);
  console.log(`  🔗 URL: ${profileUrl}`);
  
  // Extract all text from container in visual order
  const allText = extractAllTextInOrder(container);
  console.log(`  📄 Found ${allText.length} text elements`);
  
  // Create contact object
  const contact = {
    name: name,
    jobTitle: '',
    location: '',
    pastExperience: '',
    mutualConnections: '',
    additionalInfo1: '',
    additionalInfo2: '',
    profileUrl: profileUrl
  };
  
  // Categorize the text
  categorizeText(allText, contact, name);
  
  return contact;
}

function findMainProfileLink(container) {
  const profileLinks = container.querySelectorAll('a[href*="/in/"]');
  
  if (profileLinks.length === 0) return null;
  if (profileLinks.length === 1) return profileLinks[0];
  
  // Score links to find the main one
  let bestLink = null;
  let bestScore = 0;
  
  profileLinks.forEach(link => {
    let score = 0;
    const text = link.textContent.trim();
    const rect = link.getBoundingClientRect();
    
    // Valid name pattern
    if (text && text.length > 2 && text.length < 60 && /^[A-Z]/.test(text) && text.includes(' ')) {
      score += 10;
    }
    
    // Position (higher is better)
    score += Math.max(0, 50 - rect.top / 10);
    
    // Font size
    const fontSize = parseFloat(window.getComputedStyle(link).fontSize) || 14;
    score += fontSize;
    
    // Avoid obvious connection links
    if (text.includes('and ') || /\d/.test(text) || text.length < 3) {
      score -= 20;
    }
    
    console.log(`    Link: "${text}" - Score: ${score.toFixed(1)}`);
    
    if (score > bestScore) {
      bestScore = score;
      bestLink = link;
    }
  });
  
  return bestLink;
}

function extractAllTextInOrder(container) {
  const textElements = [];
  const walker = document.createTreeWalker(
    container,
    NodeFilter.SHOW_TEXT,
    null,
    false
  );
  
  const textNodes = [];
  let node;
  while (node = walker.nextNode()) {
    if (node.textContent.trim()) {
      textNodes.push(node);
    }
  }
  
  // Get all elements with text and their positions
  const allElements = container.querySelectorAll('*');
  allElements.forEach(element => {
    const text = getDirectText(element);
    if (text && text.length > 1) {
      const rect = element.getBoundingClientRect();
      textElements.push({
        text: text.trim(),
        top: rect.top,
        left: rect.left,
        element: element
      });
    }
  });
  
  // Sort by visual position (top to bottom, left to right)
  textElements.sort((a, b) => {
    const topDiff = Math.abs(a.top - b.top);
    if (topDiff > 15) {
      return a.top - b.top;
    }
    return a.left - b.left;
  });
  
  // Clean and deduplicate
  const cleanTexts = [];
  const seen = new Set();
  
  textElements.forEach(item => {
    let text = item.text.replace(/\s+/g, ' ').trim();
    
    if (text && 
        text.length > 1 && 
        text.length < 300 &&
        !seen.has(text.toLowerCase()) &&
        !text.match(/^[•\-\s]+$/)) {
      
      seen.add(text.toLowerCase());
      cleanTexts.push(text);
      console.log(`    Text: "${text}"`);
    }
  });
  
  return cleanTexts;
}

function getDirectText(element) {
  let text = '';
  for (let child of element.childNodes) {
    if (child.nodeType === Node.TEXT_NODE) {
      text += child.textContent;
    }
  }
  return text;
}

function categorizeText(textArray, contact, mainName) {
  console.log('  🏷️ Categorizing text...');
  
  const otherTexts = [];
  
  textArray.forEach((text, index) => {
    const lowerText = text.toLowerCase();
    
    // Skip the main name
    if (text === mainName || similarity(text.toLowerCase(), mainName.toLowerCase()) > 0.8) {
      console.log(`    Skipped (main name): "${text}"`);
      return;
    }
    
    console.log(`    Processing: "${text}"`);
    
    // Job Title - contains work-related keywords or company names
    if (!contact.jobTitle && isJobTitle(text, lowerText)) {
      contact.jobTitle = text;
      console.log('      → Job Title');
      return;
    }
    
    // Location - contains geographic names or location patterns
    if (!contact.location && isLocation(text, lowerText)) {
      contact.location = text;
      console.log('      → Location');
      return;
    }
    
    // Past Experience - starts with specific keywords
    if (!contact.pastExperience && isExperience(text, lowerText)) {
      contact.pastExperience = text;
      console.log('      → Past Experience');
      return;
    }
    
    // Mutual Connections - contains connection keywords
    if (!contact.mutualConnections && isMutualConnection(text, lowerText)) {
      contact.mutualConnections = text;
      console.log('      → Mutual Connections');
      return;
    }
    
    // Skip obvious UI elements
    if (!isUIElement(text, lowerText)) {
      otherTexts.push(text);
      console.log('      → Other info');
    } else {
      console.log('      → Skipped (UI element)');
    }
  });
  
  // Assign remaining texts to additional info
  if (otherTexts.length > 0) {
    contact.additionalInfo1 = otherTexts[0] || '';
    contact.additionalInfo2 = otherTexts[1] || '';
  }
}

function isJobTitle(text, lowerText) {
  return (
    lowerText.includes(' at ') ||
    lowerText.includes(' @ ') ||
    lowerText.includes('specialist') ||
    lowerText.includes('analyst') ||
    lowerText.includes('engineer') ||
    lowerText.includes('developer') ||
    lowerText.includes('manager') ||
    lowerText.includes('director') ||
    lowerText.includes('consultant') ||
    lowerText.includes('coordinator') ||
    lowerText.includes('lead') ||
    lowerText.includes('senior') ||
    lowerText.includes('junior') ||
    lowerText.includes('associate') ||
    lowerText.includes('acquisition') ||
    (lowerText.includes('ford') && !lowerText.startsWith('current')) ||
    (lowerText.includes('motor company'))
  );
}

function isLocation(text, lowerText) {
  const locations = [
    'budapest', 'hungary', 'metropolitan', 'area', 'antwerp', 'belgium',
    'germany', 'prague', 'czechia', 'italy', 'romania', 'poland',
    'france', 'spain', 'netherlands', 'austria', 'sweden', 'denmark'
  ];
  
  const hasLocation = locations.some(loc => lowerText.includes(loc));
  const hasPattern = /^[A-Z][a-z]+,?\s+[A-Z][a-z]+/.test(text); // City, Country pattern
  
  return hasLocation || hasPattern;
}

function isExperience(text, lowerText) {
  return (
    lowerText.startsWith('current:') ||
    lowerText.startsWith('past:') ||
    lowerText.startsWith('previous:') ||
    lowerText.startsWith('former:') ||
    (lowerText.includes('current') && lowerText.includes(' at '))
  );
}

function isMutualConnection(text, lowerText) {
  return (
    lowerText.includes('mutual connection') ||
    lowerText.includes('mutual contact') ||
    /\d+\s*other\s*mutual/.test(lowerText) ||
    (lowerText.includes('other') && lowerText.includes('connection') && /\d+/.test(text))
  );
}

function isUIElement(text, lowerText) {
  return (
    lowerText.includes('connect') ||
    lowerText.includes('message') ||
    lowerText.includes('view profile') ||
    lowerText.includes('send') ||
    lowerText === '•' ||
    lowerText === '2nd' ||
    lowerText === '1st' ||
    lowerText === '3rd' ||
    text.length < 2
  );
}

function similarity(str1, str2) {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;
  
  if (longer.length === 0) return 1.0;
  
  const distance = levenshteinDistance(longer, shorter);
  return (longer.length - distance) / longer.length;
}

function levenshteinDistance(str1, str2) {
  const matrix = [];
  
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  
  return matrix[str2.length][str1.length];
}

async function scrollPage() {
  console.log('📜 Scrolling page...');
  
  for (let i = 0; i <= 3; i++) {
    window.scrollTo(0, (document.body.scrollHeight / 3) * i);
    await new Promise(r => setTimeout(r, 1000));
  }
  
  window.scrollTo(0, 0);
  await new Promise(r => setTimeout(r, 1000));
  console.log('✅ Scrolling complete');
}

async function goToNextPage() {
  console.log('🔍 Looking for next page button...');
  
  const selectors = [
    'button[aria-label*="Next"]:not([disabled])',
    'button[aria-label*="next"]:not([disabled])',
    '.artdeco-pagination__button--next:not([disabled])'
  ];
  
  for (const selector of selectors) {
    const button = document.querySelector(selector);
    if (button) {
      console.log('✅ Found next button');
      button.scrollIntoView({ behavior: 'smooth', block: 'center' });
      await new Promise(r => setTimeout(r, 2000));
      
      button.click();
      await new Promise(r => setTimeout(r, 4000));
      
      // Wait for new content
      let attempts = 0;
      while (attempts < 15) {
        const links = document.querySelectorAll('a[href*="/in/"]');
        if (links.length > 0) {
          console.log('✅ Next page loaded');
          return true;
        }
        await new Promise(r => setTimeout(r, 500));
        attempts++;
      }
    }
  }
  
  console.log('❌ No next page available');
  return false;
}

async function extractMultiplePages(pageLimit) {
  const allContacts = [];
  let currentPage = 1;
  let hasNextPage = true;
  
  globalProcessedProfiles.clear();
  
  console.log('🚀 Starting simplified extraction, page limit:', pageLimit);
  
  chrome.runtime.sendMessage({
    action: 'updateProgress',
    progress: 0,
    message: 'Starting extraction...'
  });
  
  while (hasNextPage && (pageLimit === 0 || currentPage <= pageLimit)) {
    console.log(`\n📄 ========== PAGE ${currentPage} ==========`);
    
    const progress = pageLimit > 0 ? ((currentPage - 1) / pageLimit) * 85 : Math.min(currentPage * 15, 85);
    chrome.runtime.sendMessage({
      action: 'updateProgress',
      progress: progress,
      message: `Extracting page ${currentPage}...`
    });
    
    await scrollPage();
    
    const pageContacts = extractContactsFromPage();
    
    if (pageContacts.length > 0) {
      pageContacts.forEach(contact => {
        contact.pageNumber = currentPage;
        allContacts.push(contact);
      });
      
      chrome.runtime.sendMessage({
        action: 'pageComplete',
        contacts: allContacts,
        pageNumber: currentPage
      });
    }
    
    console.log(`📊 Page ${currentPage}: ${pageContacts.length} contacts (Total: ${allContacts.length})`);
    
    if (pageLimit === 0 || currentPage < pageLimit) {
      hasNextPage = await goToNextPage();
      if (hasNextPage) currentPage++;
    } else {
      hasNextPage = false;
    }
  }
  
  chrome.runtime.sendMessage({
    action: 'updateProgress',
    progress: 100,
    message: 'Complete!'
  });
  
  chrome.runtime.sendMessage({
    action: 'extractionComplete',
    totalPages: currentPage,
    totalContacts: allContacts.length
  });
  
  console.log(`🎉 Extraction complete: ${allContacts.length} contacts from ${currentPage} pages`);
  return allContacts;
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('📨 Message received:', request.action);
  
  if (request.action === 'ping') {
    sendResponse({ status: 'ready' });
  } 
  else if (request.action === 'extractMultiplePages') {
    extractMultiplePages(request.pageLimit)
      .then(contacts => {
        sendResponse({ success: true, contacts: contacts });
      })
      .catch(error => {
        console.error('❌ Error:', error);
        sendResponse({ success: false, error: error.message });
      });
    return true;
  }
  
  return false;
});

console.log('✅ LinkedIn Content Script v7.0 ready - Simplified & Reliable');