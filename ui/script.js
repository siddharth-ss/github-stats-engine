const tabs = document.querySelectorAll('.tab');
const preview = document.getElementById('preview');
const markdown = document.getElementById('markdown');
const githubGroup = document.getElementById('github-group');
const wakatimeGroup = document.getElementById('wakatime-group');
const repoUsernameGroup = document.getElementById('repo-username-group');
const repoGroup = document.getElementById('repo-group');
const gistGroup = document.getElementById('gist-group');
const githubUsernameInput = document.getElementById('github-username');
const wakatimeUsernameInput = document.getElementById('wakatime-username');
const repoUsernameInput = document.getElementById('repo-username');
const repoInput = document.getElementById('repo');
const gistInput = document.getElementById('gist-id');
const loadingOverlay = document.getElementById('loading-overlay');
const successToast = document.getElementById('success-toast');
const profileLoading = document.getElementById('profile-loading');
const profileAvatar = document.getElementById('profile-avatar');
const profileDetails = document.getElementById('profile-details');
const profileLogin = document.getElementById('profile-login');
const profileCounts = document.getElementById('profile-counts');
const profileError = document.getElementById('profile-error');
const profileRetry = document.getElementById('profile-retry');

let currentType = 'core';
let debounceTimer;
let profileRequestId = 0;

// Tab switching
tabs.forEach(tab => {
  tab.addEventListener('click', () => {
    tabs.forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    currentType = tab.dataset.type;
    
    // Hide all groups first
    githubGroup.style.display = 'none';
    wakatimeGroup.style.display = 'none';
    repoUsernameGroup.style.display = 'none';
    repoGroup.style.display = 'none';
    gistGroup.style.display = 'none';
    
    // Show relevant groups based on current type
    switch(currentType) {
      case 'core':
      case 'streak':
        githubGroup.style.display = 'flex';
        break;
      case 'wakatime':
        wakatimeGroup.style.display = 'flex';
        break;
      case 'repo':
        repoUsernameGroup.style.display = 'flex';
        repoGroup.style.display = 'flex';
        break;
      case 'gist':
        gistGroup.style.display = 'flex';
        break;
    }
    
    updatePreview();
  });
});

// Input event listeners with debouncing
document.querySelectorAll('.options input, .options select').forEach(el => {
  el.addEventListener('input', () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(updatePreview, 500);
  });
});

function getCardUrl(type) {
  const theme = document.getElementById('theme').value;
  let username, repo, gistId;
  
  // Get the appropriate username based on card type
  switch(currentType) {
    case 'core':
    case 'streak':
      username = githubUsernameInput.value.trim() || "siddharth-ss";
      break;
    case 'wakatime':
      username = wakatimeUsernameInput.value.trim();
      break;
    case 'repo':
      username = repoUsernameInput.value.trim() || "siddharth-ss";
      repo = repoInput.value.trim() || "github-stats-engine";
      break;
    case 'gist':
      gistId = gistInput.value.trim();
      break;
  }

  let base = `${window.location.origin}/api`;

  switch(type) {
    case "stats":
      base += `?username=${encodeURIComponent(username)}&show_icons=true`;
      break;
    case "streak":
      base += `/streak?username=${encodeURIComponent(username)}`;
      break;
    case "top-langs":
      base += `/top-langs/?username=${encodeURIComponent(username)}&layout=compact`;
      break;
    case "wakatime":
      base += `/wakatime?username=${encodeURIComponent(username)}`;
      break;
    case "repo":
      base += `/pin/?username=${encodeURIComponent(username)}&repo=${encodeURIComponent(repo)}`;
      break;
    case "gist":
      base += `/gist?id=${encodeURIComponent(gistId)}`;
      break;
  }

  if (theme) {
    base += `&theme=${encodeURIComponent(theme)}`;
  }

  return base;
}

function showLoading() {
  loadingOverlay.classList.add('show');
}

function hideLoading() {
  loadingOverlay.classList.remove('show');
}

function showError(msg) {
  hideLoading();
  preview.innerHTML = `<div class="error-message">${msg}</div>`;
}

async function updateProfile() {
  const username = githubUsernameInput.value.trim() || "siddharth-ss";
  const requestId = ++profileRequestId;

  profileLoading.hidden = false;
  profileLoading.textContent = "Loading GitHub profile…";
  profileAvatar.hidden = true;
  profileDetails.hidden = true;
  profileError.hidden = true;
  profileRetry.hidden = true;

  try {
    const response = await fetch(
      `${window.location.origin}/api/profile?username=${encodeURIComponent(username)}`,
      { headers: { Accept: "application/json" } },
    );
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Unable to load GitHub profile");
    if (requestId !== profileRequestId) return;

    profileAvatar.src = data.avatarUrl;
    profileAvatar.alt = `GitHub avatar for @${data.login}`;
    profileLogin.textContent = `@${data.login}`;
    profileCounts.textContent = `${new Intl.NumberFormat().format(data.followers)} Followers · ${new Intl.NumberFormat().format(data.following)} Following`;
    profileLoading.hidden = true;
    profileAvatar.hidden = false;
    profileDetails.hidden = false;
  } catch (error) {
    if (requestId !== profileRequestId) return;
    profileLoading.hidden = true;
    profileError.textContent = error.message === "GitHub profile not found"
      ? error.message
      : "Unable to load GitHub profile";
    profileError.hidden = false;
    profileRetry.hidden = false;
  }
}

profileRetry.addEventListener('click', updateProfile);

function showToast(message) {
  const toast = document.getElementById('success-toast');
  toast.querySelector('span:last-child').textContent = message;
  toast.classList.add('show');
  setTimeout(() => {
    toast.classList.remove('show');
  }, 3000);
}

function updatePreview() {
  updateProfile();
  showLoading();
  
  let urls = [];
  if (currentType === "core") {
    urls = [
      getCardUrl("stats"),
      getCardUrl("streak"),
      getCardUrl("top-langs")
    ];
  } else if (currentType === "streak") {
    urls = [getCardUrl("streak")];
  } else {
    urls = [getCardUrl(currentType)];
  }

  let md = "";
  let loaded = 0;
  let hasError = false;
  
  // Clear previous content
  const existingImages = preview.querySelectorAll('img, .error-message');
  existingImages.forEach(el => el.remove());

  urls.forEach((url, index) => {
    const img = document.createElement("img");
    img.src = url;
    img.alt = `GitHub Stats Card ${index + 1}`;
    img.style.opacity = '0';
    img.style.transform = 'translateY(20px)';
    
    img.onload = () => {
      loaded++;
      // Animate in
      setTimeout(() => {
        img.style.transition = 'all 0.5s ease';
        img.style.opacity = '1';
        img.style.transform = 'translateY(0)';
      }, index * 100);
      
      if (loaded === urls.length && !hasError) {
        hideLoading();
      }
    };
    
    img.onerror = () => {
      hasError = true;
      showError("Unable to load GitHub stats. Please check your username and try again.");
    };
    
    preview.appendChild(img);
    md += `![GitHub Stats](${url})\n`;
  });
  
  markdown.value = md.trim();
}

function refreshPreview() {
  updatePreview();
  showToast("Preview refreshed!");
}

async function copyCode() {
  try {
    await navigator.clipboard.writeText(markdown.value);
    showToast("Markdown copied to clipboard!");
  } catch (err) {
    // Fallback for older browsers
    markdown.select();
    document.execCommand("copy");
    showToast("Markdown copied to clipboard!");
  }
}

// Initialize
updatePreview();

// Add keyboard shortcuts
document.addEventListener('keydown', (e) => {
  if (e.ctrlKey || e.metaKey) {
    switch(e.key) {
      case 'c':
        if (e.target === markdown) {
          e.preventDefault();
          copyCode();
        }
        break;
      case 'r':
        e.preventDefault();
        refreshPreview();
        break;
    }
  }
});
