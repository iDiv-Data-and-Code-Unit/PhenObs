import {alertModal, confirmModal, formatDate} from './modals.js';

// export function isReachable(url) {
//   return fetch(url, { method: 'HEAD', mode: 'no-cors' })
//     .then(function(resp) {
//       return resp && (resp.ok || resp.type === 'opaque');
//     })
//     .catch(function(err) {
//       console.warn('[conn test failure]:', err);
//     });
// }

function handleConnection() {
    if (navigator.onLine) {
        // isReachable('/200/').then(function(online) {
            if (online) {
                $('#signout').removeClass('disabled');
                $('#brand').attr("href", "/");
                $('#home').removeClass('disabled');
                $('#myprofile').removeClass('disabled');
                $('#online').removeClass('d-none');
                $('#offline').addClass('d-none');
                console.log('online');

                return true;
            } else {
                $('#signout').addClass('disabled');
                $('#brand').removeAttr("href");
                $('#home').addClass('disabled');
                $('#myprofile').addClass('disabled');
                $('#offline').removeClass('d-none');
                $('#online').addClass('d-none');
                console.log('no connectivity');

                return false;
            }
        // });
    } else {
        $('#signout').addClass('disabled');
        $('#brand').removeAttr("href");
        $('#home').addClass('disabled');
        $('#myprofile').addClass('disabled');
        $('#help').addClass('disabled');
        $('#offline').removeClass('d-none');
        $('#online').addClass('d-none');
        console.log('offline');

        return false;
    }
}

$(document).ready(function() {
    handleConnection();
    window.addEventListener('online', handleConnection);
    window.addEventListener('offline', handleConnection);
});

if (document.getElementById('home-date') != null)
    changeHomeDate();

if (document.getElementById('add-collection') != null) {
    $('#add-collection').click(() => {
        // isReachable('/200').then(function(onLine) {
            if (navigator.onLine) {
                location.href = '/observations/add/'
            } else {
                alertModal('Add functionality is not available in offline mode');
            }
        // });
    });
}

function changeHomeDate() {
    let homeDate = document.getElementById('home-date');
    homeDate.innerText = formatDate(new Date()).toString();
}
