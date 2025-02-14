chrome.action.onClicked.addListener(() => {
  chrome.tabs.create({
    url: 'inscriptions.html'
  });
}); 