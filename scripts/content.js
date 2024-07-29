var url = "";
const todoresp = { todo: "showPageAction" };

chrome.runtime.sendMessage(todoresp);

let dataExtracted = false; // Flag to check if data has been extracted

main();

function main() {
  var sliderInnerHTMLString = `
  <!-- HEADER IS HERE -->
  <div id='sheader' style='padding: 5px 10px;'> <!-- Adjusted padding for a thinner header -->
    <div id='sheaderheader'><h1>Linkedin Scraper</h1></div>
    <div class='internal_button sticky_buttons' id='clear_text_button' style='display: none;'>Clear Text?</div>
    <br/>
  </div>
  <br/>

  <!-- THE BODY CONTAINER IS HERE -->
  <div id='sbodycontainer'>
    <h2>Profile</h2>
    <div class="form-group">
      <label for="fullName">Full Name</label>
      <input type="text" id="fullName" class="form-control"/>
    </div>
    <div class="form-group">
      <label for="title">Title</label>
      <input type="text" id="title" class="form-control"/>
    </div>
    <div class="form-group">
      <label for="location">Location</label>
      <input type="text" id="location" class="form-control"/>
    </div>
    <div class="form-group">
      <label for="description">Description</label>
      <input type="text" id="description" class="form-control"/>
    </div>
    <div class="form-group">
      <label for="email">Email</label>
      <input type="text" id="email" class="form-control"/>
    </div>
    <div class="form-group">
      <label for="phoneNumber">Phone Number</label>
      <input type="text" id="phoneNumber" class="form-control"/>
    </div>
    <div class="form-group">
      <label for="website">Website</label>
      <input type="text" id="website" class="form-control"/>
    </div>
    <div class="form-group">
      <label for="url">URL</label>
      <input type="text" id="url" class="form-control"/>
    </div>

    <br/> <!-- Add space between Profile and Experience sections -->
    <h2>Experience</h2>
    <div id="experienceContainer"></div>
    <div class='internal_button' id='experience_extract_button'>Extract Experience</div>
    <hr/>

    <!-- Commented out Certifications Section -->
    <!--
    <h2>Licenses and Certifications</h2>
    <div id="certificationsContainer"></div>
    <div class='internal_button' id='certification_extract_button'>Extract Certifications</div>
    <hr/>
    -->

    <!-- Commented out Skills Section -->
    <!--
    <h2>Skills</h2>
    <div id="skillsContainer"></div>
    <div class='internal_button' id='skills_extract_button'>Extract Skills</div>
    -->
  </div>
  <br/>
  <br/>

  <!-- THE FOOTER IS HERE -->
  <div id='sfooter'><hr/>
    <div class='internal_button' id='save_profile_data_button'>Save Profile Data</div>
  </div>
  `;

  sliderGen(sliderInnerHTMLString);

  chrome.runtime.onMessage.addListener(function (msg, sender, sendResponse) {
    if (msg.todo == "toggle") {
      slider();
    }
  });

  document.getElementById('clear_text_button').addEventListener("click", function () {
    clearAllFields();
  });

  // Check if data has already been extracted
  if (!dataExtracted) {
    extractData(); // Call the function to extract data
    dataExtracted = true; // Set the flag to true after extraction
  }

  // Set the URL field to the current LinkedIn URL
  document.getElementById('url').value = window.location.href;

  // Set up the scroll event listener
  document.getElementById("slider").onscroll = function () {
    printName(); // Assuming this function is for printing the name
    // Only update form fields if data has not been extracted
    if (!dataExtracted) {
      updateFormFields(extract()); // Call your extract function here
    }
  };

  document.getElementById('experience_extract_button').addEventListener("click", getExperienceCode);
  document.getElementById('save_profile_data_button').addEventListener("click", saveProfileData);
}

function sliderGen(sliderInnerHTMLString) {
  var slider = document.createElement("div");
  slider.id = "slider";
  var sliderDivInnerHTML = sliderInnerHTMLString;

  slider.innerHTML += sliderDivInnerHTML;

  document.body.prepend(slider);
}

function slider() {
  var slider = document.getElementById("slider");

  var styler = slider.style;
  if (styler.width == "0px" || !styler.width) {
    styler.width = "400px";
  } else {
    styler.width = "0px";
  }
}

let extractedCompany = "";

function getExperienceCode() {
  var exp = [];
  var experienceSection = document.querySelector(
    '#profile-content > div > div.scaffold-layout.scaffold-layout--breakpoint-xl.scaffold-layout--main-aside.scaffold-layout--reflow.pv-profile.pvs-loader-wrapper__shimmer--animate > div > div > main > section:nth-child(4)'
  );

  if (experienceSection) {
    var listItems = experienceSection.parentElement.querySelectorAll('li');
    listItems.forEach((item) => {
      var titleElement = item.querySelector('div.display-flex.align-items-center.mr1.t-bold span[aria-hidden="true"]');
      var title = titleElement ? getCleanText(titleElement.textContent) : null;

      var companyDurationElement = item.querySelector('span.t-14.t-normal');
      var companyDurationText = companyDurationElement ? getCleanText(companyDurationElement.textContent) : null;
      var [company, duration] = companyDurationText ? companyDurationText.split(' · ') : [null, null];

      var locationElement = item.querySelector('span.t-14.t-normal.t-black--light');
      var location = locationElement ? getCleanText(locationElement.textContent) : null;

      if (title && company) {
        exp.push({
          title: title,
          company: company,
          duration: duration,
          location: location
        });
      }
    });
  } else {
    console.error('Experience section not found');
  }

  updateExperienceFields(exp);

  extractedCompany = exp[0]?.company || "";
}

function updateExperienceFields(experiences) {
  const container = document.getElementById('experienceContainer');
  container.innerHTML = ''; // Clear existing fields

  if (experiences.length > 0) {
    const exp = experiences[0]; // Get the first experience
    const expDiv = document.createElement('div');
    expDiv.innerHTML = `
      <h3>Experience</h3>
      <div class="form-group">
        <label for="expTitle">Title</label>
        <input type="text" id="expTitle" class="form-control" value="${exp.title || ''}"/>
      </div>
      <div class="form-group">
        <label for="expCompany">Company</label>
        <input type="text" id="expCompany" class="form-control" value="${exp.company || ''}"/>
      </div>
    `;
    container.appendChild(expDiv);
  } else {
    container.innerHTML = '<p>No experience found.</p>'; // Message if no experience is available
  }
}

function extractData() {
  // Logic to extract data from the profile and populate input fields
  const profileData = extract(); // Assume this function extracts data from the profile

  // Populate input fields with extracted data
  document.getElementById('fullName').value = profileData.fullName || '';
  document.getElementById('title').value = profileData.title || '';
  document.getElementById('location').value = profileData.location || '';
  document.getElementById('description').value = profileData.description || '';
  document.getElementById('email').value = profileData.email || '';
  document.getElementById('phoneNumber').value = profileData.phoneNumber || '';
  document.getElementById('website').value = profileData.website || '';
  document.getElementById('url').value = window.location.href; // Set the URL field to the current LinkedIn URL
}

// Function to generate a UUID
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

function saveProfileData() {
  var profileData = {
    basicprofile: {
      fullName: document.getElementById('fullName').value,
      title: document.getElementById('title').value,
      location: document.getElementById('location').value,
      description: document.getElementById('description').value,
      email: document.getElementById('email').value,
      phoneNumber: document.getElementById('phoneNumber').value,
      website: document.getElementById('website').value,
      url: document.getElementById('url').value // This will now contain the LinkedIn URL
    },
    experience: [],
    certifications: [],
    skills: []
  };

  // Collect experience data (only the first experience)
  const expTitle = document.getElementById('expTitle');
  const expCompany = document.getElementById('expCompany'); // Get the company input value

  if (expTitle && expCompany) {
    profileData.experience.push({
      title: expTitle.value,
      company: expCompany.value,
      duration: "", // Set to empty or default value
      location: ""  // Set to empty or default value
    });
  }

  // Debugging: Log the profileData object
  console.log('Profile Data:', profileData);

  // Post the data to the API
  fetch('#API_LINK', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      id: generateUUID(), // Use UUID for unique ID generation
      first_name: profileData.basicprofile.fullName.split(" ")[0],
      last_name: profileData.basicprofile.fullName.split(" ")[1],
      title: profileData.basicprofile.title || "default-title",
      account_name: expCompany.value || "Unknown", // Use the company input value as account_name
      leadsource: profileData.leadsource || "linkedin.com",
      phone_mobile: profileData.basicprofile.phoneNumber || "", // Send phoneNumber as phone_mobile
      linkedin_url: profileData.basicprofile.url || "", // Send the URL as linkedin_url
      experience: profileData.experience,
      certifications: profileData.certifications,
      skills: profileData.skills
    })
  })
    .then(response => response.json())
    .then(data => {
      console.log('Success:', data);
      alert('Data saved and posted successfully!');
    })
    .catch((error) => {
      console.error('Error:', error);
      alert('Error posting data.');
    });
}

function getCleanText(text) {
  return text.replace(/[\s\n\r]+/g, ' ').trim();
}

function clearAllFields() {
  // Clear all profile fields
  document.getElementById('fullName').value = '';
  document.getElementById('title').value = '';
  document.getElementById('location').value = '';
  document.getElementById('description').value = '';
  document.getElementById('email').value = '';
  document.getElementById('phoneNumber').value = '';
  document.getElementById('website').value = '';
  document.getElementById('url').value = '';

  // Clear all experience fields
  document.getElementById('experienceContainer').innerHTML = '';
}

function printName() {
  var profileSection = document.querySelector('#profile-content');
  if (profileSection) {
    var nameElement = profileSection.querySelector('li.inline.t-24.t-black.t-normal.break-words');
    var name = nameElement ? getCleanText(nameElement.textContent) : '';
    console.log(name);
  }
}

function updateFormFields(profileData) {
  // Update form fields with extracted profile data
  document.getElementById('fullName').value = profileData.fullName || '';
  document.getElementById('title').value = profileData.title || '';
  document.getElementById('location').value = profileData.location || '';
  document.getElementById('description').value = profileData.description || '';
  document.getElementById('email').value = profileData.email || '';
  document.getElementById('phoneNumber').value = profileData.phoneNumber || '';
  document.getElementById('website').value = profileData.website || '';
  document.getElementById('url').value = profileData.url || '';
}

function extract() {
  const profileSection = document.querySelector(".mt2.relative");

  const fullNameElement = profileSection?.querySelector('h1.text-heading-xlarge');
  const fullName = fullNameElement?.textContent.trim() || null;

  const titleElement = profileSection?.querySelector('div.text-body-medium');
  const title = titleElement?.textContent.trim() || null;

  const locationElement = profileSection?.querySelector('span.text-body-small');
  const location = locationElement?.textContent.trim() || null;

  const descriptionElement = profileSection?.querySelector('div.display-flex.ph5.pv3 div.inline-show-more-text');
  const description = descriptionElement?.textContent.trim() || null;

  const websiteElement = document.querySelector('a.link-without-visited-state');
  const website = websiteElement?.href.trim() || null;

  const emailElement = document.querySelector('.pv-contact-info__contact-type.ci-email a');
  const email = emailElement?.textContent.trim() || null;

  const phoneNumberElement = document.querySelector('.pv-contact-info__contact-type.ci-phone .t-14.t-black.t-normal');
  const phoneNumber = phoneNumberElement?.textContent.trim() || null;

  const urlElement = document.querySelector('div.ember-view div a');
  const url = urlElement?.href.trim() || null;

  return { fullName, title, location, description, website, email, phoneNumber, url };
}
