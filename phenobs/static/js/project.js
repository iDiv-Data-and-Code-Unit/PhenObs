function formatDate(dateToFormat) {
    let options = {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    };

    return dateToFormat.toLocaleString('en-US', options));
}
