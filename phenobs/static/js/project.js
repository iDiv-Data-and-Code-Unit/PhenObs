import {alertModal, formatDate} from './modals.js';

/**
 * Function to return a cookie from browser storage
 *
 * Original stackoverflow answer: {@link https://stackoverflow.com/a/33385593/17511327}
 * @param {string} cname - Name of the cookie
 * @returns Cookie value
 */
export function getCookie(cname) {
    var name = cname + "=";
    var ca = document.cookie.split(';');
    for(var i=0; i<ca.length; i++) {
       var c = ca[i];
       while (c.charAt(0)==' ') c = c.substring(1);
       if(c.indexOf(name) == 0)
          return c.substring(name.length,c.length);
    }
    return "";
}

/**
 * Check whether the device has an active internet connection or not and disables some functionality
 * @return {boolean} Connection status (true for online)
 */
function handleConnection() {
    if (navigator.onLine) {
        $('#signout').removeClass('disabled');
        $('#brand').attr("href", "/");
        $('#home').removeClass('disabled');
        $('#admin_panel').removeClass('disabled');
        $('#myprofile').removeClass('disabled');
        $('#online').removeClass('d-none');
        $('#offline').addClass('d-none');

        return true;
    } else {
        $('#signout').addClass('disabled');
        $('#brand').removeAttr("href");
        $('#home').addClass('disabled');
        $('#admin_panel').addClass('disabled');
        $('#myprofile').addClass('disabled');
        $('#offline').removeClass('d-none');
        $('#online').addClass('d-none');

        return false;
    }
}

// Add the function as event listeners to handle connection status changes
$(document).ready(function() {
    handleConnection();
    window.addEventListener('online', handleConnection);
    window.addEventListener('offline', handleConnection);
});

// Set the date in home page main jumbotron
if (document.getElementById('home-date') != null)
    changeHomeDate();

// Add click listener to run connection check before redirecting user to add collection page
if (document.getElementById('add-collection') != null) {
    $('#add-collection').click(() => {
        if (navigator.onLine) {
            location.href = '/observations/add/'
        } else {
            alertModal('Add functionality is not available in offline mode');
        }
    });
}

/**
 * Sets date string in home page to today's date
 */
function changeHomeDate() {
    let homeDate = document.getElementById('home-date');
    homeDate.innerText = formatDate(new Date()).toString();
}
