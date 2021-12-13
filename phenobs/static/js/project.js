function formatDate(dateToFormat) {
    let options = {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    };

    return dateToFormat.toLocaleString('en-US', options);
}

function checkConnection() {
    $.ajax({
        url: "/200",
        error: function (jqXHR) {
            $('#offline').removeClass('d-none');
            $('#online').addClass('d-none');
            return false;
        },
        success: function (data) {
            $('#online').removeClass('d-none');
            $('#offline').addClass('d-none');
            return true;
        }
    });
}

$(document).ready(function() {
    checkConnection();
    setInterval(() => checkConnection(), 30000);
});
