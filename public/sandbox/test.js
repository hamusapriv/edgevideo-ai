// Standalone sandbox script. You can write plain JS here.
// This does not import or rely on the React app code.

const root = document.getElementById("root");
root.textContent = "Sandbox ready. Add your experiments in test.js";

// Example helper you can remove:
window.sayHello = (name = "world") => {
  console.log(`Hello, ${name}!`);
};
