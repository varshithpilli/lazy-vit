const solveChennai = (img, textBox) => {
  fetch(chrome.runtime.getURL("weights.json"))
    .then((response) => response.json())
    .then((data) => {

      const HEIGHT = 40;
      const WIDTH = 200;

      const weights = data.weights;
      const biases = data.biases;

      const label_txt = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0);
      const pd = ctx.getImageData(0, 0, WIDTH, HEIGHT);

      let sat = saturation(pd.data);
      let def = deflatten(sat, [HEIGHT, WIDTH]);
      let blocksList = ChennaiBlocks(def);
      let out = "";
      for (let i = 0; i < 6; i += 1) {
        let block = preProcess(blocksList[i]);
        block = [flatten(block)];
        block = matrixMultiplication(block, weights);
        block = matrixAddition(...block, biases);
        block = softmax(block);
        block = block.indexOf(Math.max(...block));
        out += label_txt[block];
      }
      textBox.value = out.trim();
      var box = document.getElementsByClassName("row")[1];
      addCredits(box);
    });
};

// const tryUrls = () => {
//   console.log(document.URL)
  
//   if (document.URL.match("vtopcc.vit.ac.in")) {
//     let img = document.getElementById("captchaBlock")?.children[0];
//     if (!img) {
//       img = document.getElementsByClassName("form-control bg-light border-0")[0];
//     }
    
//     let textBox = document.getElementById("captchaStr");
    
//     if (!img || !textBox) {
//       console.log("No captcha found on this page");
//       return;
//     }
    
//     img.style.height = "40px!important";
//     img.style.width = "200px!important";
//     solveChennai(img, textBox);

//     let container = document.getElementById("captchaBlock");
//     if (!container) {
//       console.log("No captcha container found");
//       return;
//     }
    
//     container.addEventListener('DOMSubtreeModified', () => {
//       img = document.getElementById("captchaBlock")?.children[0];
//       if (!img) {
//         img = document.getElementsByClassName("form-control bg-light border-0")[0];
//       }
//       if (!img) return;
      
//       img.style.height = "40px!important";
//       img.style.width = "200px!important";
//       let textBox = document.getElementById("captchaStr");
//       if (textBox) {
//         solveChennai(img, textBox);
//       }
//     });
//   }

//   // ffcs step 1 captcha
//   else if (document.URL.match("https://vtopregcc.vit.ac.in/RegistrationNew/")) {
//     let img = document.getElementById("captcha_id");
//     let textBox = document.getElementById("captchaString");
    
//     if (!img || !textBox) {
//       console.log("No captcha found on this page");
//       return;
//     }
    
//     img.style.height = "40px!important";
//     img.style.width = "200px!important";
//     solveChennai(img, textBox);
//   }

//   // ffcs step 2 captcha
//   else if (document.URL.match("https://vtopregcc.vit.ac.in/RegistrationNew/") && document.getElementById("captchaStringProgInfo")) {
//     let img = document.getElementById("captcha_id");
//     let textBox = document.getElementById("captchaStringProgInfo");
    
//     if (!img || !textBox) {
//       console.log("No captcha found on this page");
//       return;
//     }
    
//     img.style.height = "40px!important";
//     img.style.width = "200px!important";
//     solveChennai(img, textBox);

//     const observer = new MutationObserver(() => {
//       const newImg = document.getElementById("captcha_id");
//       const newBox = document.getElementById("captchaStringProgInfo");
//       if (newImg && newBox) {
//         newImg.style.height = "40px!important";
//         newImg.style.width = "200px!important";
//         solveChennai(newImg, newBox);
//       }
//     });

//     const testDiv = document.getElementById("test");
//     if (testDiv) observer.observe(testDiv, { childList: true, subtree: true });
//   }
// }

const tryUrls = () => {
  console.log(document.URL);
  
  if (document.URL.match("vtopcc.vit.ac.in")) {
    let img = document.getElementById("captchaBlock")?.children[0];
    if (!img) {
      img = document.getElementsByClassName("form-control bg-light border-0")[0];
    }
    
    let textBox = document.getElementById("captchaStr");
    
    if (!img || !textBox) {
      console.log("No captcha found on this page");
      return;
    }
    
    img.style.height = "40px!important";
    img.style.width = "200px!important";
    solveChennai(img, textBox);

    let container = document.getElementById("captchaBlock");
    if (!container) {
      console.log("No captcha container found");
      return;
    }
    
    container.addEventListener('DOMSubtreeModified', () => {
      img = document.getElementById("captchaBlock")?.children[0];
      if (!img) {
        img = document.getElementsByClassName("form-control bg-light border-0")[0];
      }
      if (!img) return;
      
      img.style.height = "40px!important";
      img.style.width = "200px!important";
      let textBox = document.getElementById("captchaStr");
      if (textBox) {
        solveChennai(img, textBox);
      }
    });
  }

  // Registration page - handles BOTH step 1 and step 2
  else if (document.URL.match("https://vtopregcc.vit.ac.in/RegistrationNew/")) {
    
    // Check for Step 2 CAPTCHA first (more specific)
    if (document.getElementById("captchaStringProgInfo")) {
      console.log("Step 2 CAPTCHA detected");
      
      const solveCaptchaStep2 = () => {
        let img = document.getElementById("captcha_id");
        let textBox = document.getElementById("captchaStringProgInfo");
        
        if (img && textBox) {
          img.style.height = "40px!important";
          img.style.width = "200px!important";
          solveChennai(img, textBox);
          console.log("Step 2 CAPTCHA solved");
        }
      };
      
      // Solve initial CAPTCHA
      solveCaptchaStep2();
      
      // Set up observer for CAPTCHA refresh
      const testDiv = document.getElementById("test");
      if (testDiv) {
        const observer = new MutationObserver(() => {
          console.log("CAPTCHA refreshed, solving again...");
          solveCaptchaStep2();
        });
        
        observer.observe(testDiv, { 
          childList: true, 
          subtree: true,
          attributes: true,
          attributeFilter: ['src'] 
        });
        
        console.log("Observer set up for Step 2 CAPTCHA");
      }
      
      // Also watch for the refresh button click
      const refreshButton = document.getElementById("refreshCaptchaProcess");
      if (refreshButton) {
        refreshButton.addEventListener('click', () => {
          console.log("Refresh button clicked");
          setTimeout(solveCaptchaStep2, 500); // Wait for new CAPTCHA to load
        });
      }
    }
    // Step 1 CAPTCHA
    else if (document.getElementById("captchaString")) {
      console.log("Step 1 CAPTCHA detected");
      let img = document.getElementById("captcha_id");
      let textBox = document.getElementById("captchaString");
      
      if (img && textBox) {
        img.style.height = "40px!important";
        img.style.width = "200px!important";
        solveChennai(img, textBox);
        console.log("Step 1 CAPTCHA solved");
      }
    }
  }
}

// Also run when DOM is ready (in case load event already fired)
if (document.readyState === "complete" || document.readyState === "interactive") {
  setTimeout(tryUrls, 100);
}

window.addEventListener("load", tryUrls, false);