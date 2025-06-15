/* eslint-disable */
export async function getRedirectedDomain(initialUrl) {
  try {
    const response = await fetch(
      `http://localhost:3000/getRedirectedDomain?url=${encodeURIComponent(initialUrl)}`
    );
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    const data = await response.json();
    return data.domain;
  } catch (error) {
    console.error('Error in getting redirected domain:', error);
    return null;
  }
}

export function extractDomainFromParameter(url) {
  let regex = /[?&](?:u|r)=https%3A%2F%2F([^%]+)/;
  let match = url.match(regex);
  if (!match) {
    regex = /\/destination:([^\s]+)/;
    match = url.match(regex);
  }
  if (match) {
    const decodedUrl = decodeURIComponent(match[1]);
    console.log(`Extracted and decoded URL: ${decodedUrl}`);
    let urlToParse = decodedUrl;
    if (!decodedUrl.startsWith('http://') && !decodedUrl.startsWith('https://')) {
      urlToParse = 'https://' + decodedUrl;
    }
    const domain = new URL(urlToParse).hostname;
    return domain;
  }
  console.log(`No match found in URL: ${url}`);
  return null;
}

export function extractDomain(url) {
  const parsedUrl = new URL(url);
  const hostname = parsedUrl.hostname;
  const parts = hostname.split('.');
  if (parts.length > 2) {
    return parts.slice(-2).join('.');
  }
  return hostname;
}

export function AddClassToAll(element, className) {
  element.classList.add(className);
  element.querySelectorAll('*').forEach((child) => {
    child.classList.add(className);
  });
}

export function RemoveClassFromAll(element, className) {
  element.classList.remove(className);
  element.querySelectorAll('*').forEach((child) => {
    child.classList.remove(className);
  });
}
