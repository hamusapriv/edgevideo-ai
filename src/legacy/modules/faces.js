/* eslint-disable */
export let faceDataQueue = [];

export function addToFaceDataQueue(newFaceData) {
  const exists = faceDataQueue.some((face) => face.id === newFaceData.id);
  if (!exists) {
    faceDataQueue.push(newFaceData);
    if (faceDataQueue.length > 10) {
      faceDataQueue.shift();
    }
  }
}

export function UpdateFaces() {
  let faceData = null;
  if (faceDataQueue.length > 0) {
    faceData = faceDataQueue.shift();
  } else {
    return;
  }

  let faceDivs = document.querySelectorAll("div.face");
  let matchedFaceDiv = null;
  let oldestFaceDiv = null;
  let startTime = 100;
  for (let faceDiv of faceDivs) {
    startTime -= 1;
    const faceId = faceDiv.getAttribute("data-id");
    if (faceId == faceData.id) {
      edgeConsole.log("Duplicate face ID");
      return;
    }
  }
  oldestFaceDiv = document.querySelector(".face0");
  let targetFaceDiv;
  if (matchedFaceDiv) {
    targetFaceDiv = matchedFaceDiv;
  } else {
    targetFaceDiv = oldestFaceDiv;
  }
  try {
    if (targetFaceDiv == null) return;
    targetFaceDiv.setAttribute("data-id", faceData.id);
    targetFaceDiv.setAttribute("data-time", Date.now());

    const nameElement = targetFaceDiv.querySelector("p.face-name");
    if (nameElement) {
      nameElement.innerText = faceData.name;
    }

    const fameElement = targetFaceDiv.querySelector("p.face-fame");
    if (fameElement) {
      if (faceData.accomplishments !== "{}") {
        fameElement.innerText = faceData.accomplishments;
      } else {
        fameElement.innerText = "";
      }
    }

    const dobElement = targetFaceDiv.querySelector("p.face-dob");
    if (dobElement) {
      const dob = new Date(faceData.dob);
      const formattedDOB = `${dob.getMonth() + 1}/${dob.getDate()}/${dob.getFullYear()}`;
      dobElement.innerText = formattedDOB;
    }

    const imageElement = targetFaceDiv.querySelector("img.face-image");
    if (imageElement) {
      imageElement.src = faceData.image_url;
      imageElement.srcset = "";
    }

    const socialsLinks = targetFaceDiv.querySelectorAll(
      "div.socials-links p.socials-link"
    );
    socialsLinks.forEach((linkElement, index) => {
      if (linkElement && index < 3) {
        linkElement.innerHTML = "";
      }
    });

    const socialUrls = {
      twitter_url: faceData.twitter_url
        ? `<a href="${faceData.twitter_url}" target="_blank"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"> <circle cx="12" cy="12" r="12" fill="black"/> <path d="M15.15 17.4L6.30005 6.59998H8.70005L17.55 17.4H15.75H15.15Z" stroke="white"/> <path d="M17.6999 6L12.8999 11.55L12.5999 11.1L12.1499 10.65L16.1999 6H17.6999Z" fill="white"/> <path d="M11.55 13.05L7.35 17.7H6L11.2248 11.7L10.8344 12.15L11.55 13.05Z" fill="white"/> </svg></a>`
        : "",
      facebook_url: faceData.facebook_url
        ? `<a href="${faceData.facebook_url}" target="_blank"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"> <circle cx="12" cy="12" r="12" fill="black"/> <path d="M14.9155 8.72727V10.4176H9.43397V8.72727H14.9155ZM10.8044 18V7.85192C10.8044 7.2281 10.9331 6.70892 11.1907 6.29439C11.4523 5.87985 11.8025 5.56996 12.2411 5.3647C12.6798 5.15945 13.1668 5.05682 13.7021 5.05682C14.0804 5.05682 14.4164 5.087 14.7102 5.14737C15.004 5.20774 15.2214 5.26207 15.3622 5.31037L14.9276 7.00071C14.835 6.97254 14.7183 6.94436 14.5774 6.91619C14.4366 6.884 14.2796 6.8679 14.1066 6.8679C13.7001 6.8679 13.4123 6.9665 13.2433 7.16371C13.0783 7.35689 12.9958 7.63459 12.9958 7.9968V18H10.8044Z" fill="white"/> </svg></a>`
        : "",
      instagram_url: faceData.instagram_url
        ? `<a href="${faceData.instagram_url}" target="_blank"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"> <circle cx="12" cy="12" r="12" fill="black"/> <rect x="6.5" y="6.5" width="11" height="11" rx="2.5" stroke="white"/> <circle cx="12" cy="12" r="2.5" stroke="white"/> <circle cx="15.1499" cy="8.84998" r="0.75" fill="white"/> </svg></a>`
        : "",
    };

    let validSocialLinks = 0;
    socialsLinks.forEach((linkElement, index) => {
      if (linkElement && index < 3) {
        const socialKey = Object.keys(socialUrls)[index];
        linkElement.innerHTML = socialUrls[socialKey];
        if (socialUrls[socialKey] != "") validSocialLinks++;
      }
    });

    if (validSocialLinks == 0) {
      targetFaceDiv.querySelector("div.face-socials").style.display = "none";
    } else {
      targetFaceDiv.querySelector("div.face-socials").style.display = "block";
    }

    targetFaceDiv.parentElement.insertBefore(
      targetFaceDiv,
      targetFaceDiv.parentElement.firstChild
    );
  } catch (error) {
    edgeConsole.error("Error updating face data:", error);
  }
}
