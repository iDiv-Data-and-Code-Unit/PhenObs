function formatDate(dateToFormat, includeYear=true) {
    let options = {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
    };

    if (includeYear)
        options.year = 'numeric';

    return dateToFormat.toLocaleString('en-US', options);
}

function checkConnection() {
    $.ajax({
        url: "/200",
        error: function (jqXHR) {
            $('#signout').addClass('disabled');
            $('#myprofile').addClass('disabled');
            $('#offline').removeClass('d-none');
            $('#online').addClass('d-none');
            return false;
        },
        success: function (data) {
            $('#signout').removeClass('disabled');
            $('#myprofile').removeClass('disabled');
            $('#online').removeClass('d-none');
            $('#offline').addClass('d-none');
            return true;
        }
    });
}

$(document).ready(function() {
    checkConnection();
    setInterval(() => checkConnection(), 15000);
});

if (document.getElementById('home-date') != null)
    changeHomeDate();

function changeHomeDate() {
    let homeDate = document.getElementById('home-date');
    homeDate.innerText = formatDate(new Date(), false).toString();
}
