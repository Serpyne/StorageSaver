/*
Functions for formatting:
    - Size in bytes to a string representing anything from bytes to gigabytes.
    - Date-Time from a string into a string representation of the date.
    - Same for the time component.
*/

function formatSize(/*int*/size) {
    /*
    Takes a file size in bytes as an integer,
    and returns the formatted size as a string.
    */
   let mult;
   let suffix;
    if (size < 1_000) {
        return `${size} bytes`
    } else if (size < 1_000_000) {
        mult = .01;
        suffix = "KB";
    } else if (size < 1_000_000_000) {
        mult = .00001;
        suffix = "MB";
    } else if (size < 1_000_000_000_000) {
        mult = .00000001;
        suffix = "GB";
    }
    return `${(Math.trunc(size * mult) * .1).toFixed(1)} ${suffix}`;
}

function formatDate(/*string*/dateString) {
    // Parses a datetime string and returns a string version of the date
    let formattedDate = new Date(Date.parse(dateString));
    return formattedDate.toDateString();
}

function formatTime(/*string*/dateString) {
    // Parses a datetime string and returns a string version of the time
    let formattedDate = new Date(Date.parse(dateString));
    return formattedDate.toTimeString();
}
