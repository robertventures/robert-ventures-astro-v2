const excludedPaths = ['/signup', '/questions', '/booking'];
const currentPath = "{currentPath}"; // Inject the server-side path into the client-side script

console.log("Chatbot loaded")

if (!excludedPaths.includes(currentPath)) {
  var script = document.createElement('script');
  script.src = "https://widgets.leadconnectorhq.com/loader.js";
  script.setAttribute("data-resources-url", "https://widgets.leadconnectorhq.com/chat-widget/loader.js");
  script.setAttribute("data-widget-id", "672a148805dded393695deca");
  document.head.appendChild(script);
}