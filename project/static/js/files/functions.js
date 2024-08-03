/*
Functions for array manipulation, such as:
    - swap - Swapping two items in an array based on their indices
    - reverse - Reversing/mirroring an array
    - partition - Select a partition from an array, which sorts an array of file objects against an array of a property of files
    - quickSort - Sorts a list of file objects using the quick sort algorithm. 
    - quickSortFiles - Sort a list of file objects based on a property of a file.
*/

function swap(/*array*/array, /*int*/a, /*int*/b) {
    /*
    Swap two items of a mutable array in place, based on their respective indices.
    */
    [array[a], array[b]] = [array[b], array[a]];
}

function reverse(/*array*/array) {
    /*
    Reverse the items of an array in place (nothing is returned).
    */

    let middleIndex = array.length / 2;
    let highIndex = array.length - 1

    for (let i = 0; i < middleIndex; i++)
        swap(array, i, highIndex - i);
}


function partition(/*array*/files, /*array*/filesProperty, /*int*/lowIndex, /*int*/highIndex) {
    /*
    Selects the last element in the array to be a pivot.
    The pivot is then compared with the rest of the array,
    performing swaps where a given value is less than the pivot's value.
    The pivot is placed in its correct position.
    Finally, the pivot's index is returned as an integer.
    */
    let pivot = filesProperty[highIndex];

    let smallestIndex = lowIndex - 1;
    for (let i = lowIndex; i <= highIndex - 1; i++) {
        if (filesProperty[i] < pivot) {
            smallestIndex++;
            swap(files, i, smallestIndex);
            swap(filesProperty, i, smallestIndex);
        }
    }

    swap(files, smallestIndex + 1, highIndex);
    swap(filesProperty, smallestIndex + 1, highIndex);
    return smallestIndex + 1;
}

function quickSort(/*array*/files, /*array*/filesProperty, /*int*/lowIndex, /*int*/highIndex) {
    /*
    Sorts a mutable array in place, using the quick-sort algorithm [Time complexity of O(n log n)].
    A partition (otherwise known as a pivot) is selected by calling the 'partition' method on the array.
    By "divide and conquer", the two subarrays next to the partitioned point are recursively sorted.
    Once the higher bound of the array is less than or equal to the lower bound, the algorithm completes.
    Hence, the array is completely sorted.

    Note that you can compare strings in JavaScript using the less than or greater than operators.
    The only difference with traditional sorting being that the strings starting with uppercase characters
    appear before the strings starting with lowercase letters.
    Hence, this function works with comparing file names in the Storage Saver.

    'files' is a list of objects which represents the file data.
    'filesProperty' is a list of only a given property for each file in the files list.
        Though, both lists are in the same order.
    */
    if (highIndex > lowIndex) {
        let partitionIndex = partition(files, filesProperty, lowIndex, highIndex);

        quickSort(files, filesProperty, lowIndex, partitionIndex - 1);
        quickSort(files, filesProperty, partitionIndex + 1, highIndex);
    }
}

/*
Format (of a file object):
    {
        "name":          "test.png",
        "date_taken":    "2024/05/04 12:00:00",
        "date_uploaded": "2024/07/31 12:00:00",
        "type":          "PNG File",
        "size":          12400
        "src":           ...
    },
*/
let fileDates;
function quickSortFiles(/*array*/files, /*string*/sortBy, /*literal*/sortDirection) {
    /*
    Returns a sorted list of files based on the criteria to sort by and the direction of sorting.
    Returns null if the criteria for sorting is invalid.

    Accepted values for sortBy: [NAME, DATE_TAKEN, DATE_UPLOADED, TYPE, SIZE]
    Accepted values for sortDirection: [ASCENDING, DESCENDING]
    */
    let sortedFiles = files.slice();
    let highIndex = sortedFiles.length - 1;

    switch (sortBy) {
        case NAME:
            let fileNames = sortedFiles.map(file => file.name);
            quickSort(sortedFiles, fileNames, 0, highIndex);
            break;

        case DATE_TAKEN:
            // If the file has no property 'date_taken', then the value returned is 0.
            fileDates = sortedFiles.map(file => {
                if (!file.date_taken)
                    return 0;
                return Date.parse(file.date_taken);
            });
            quickSort(sortedFiles, fileDates, 0, highIndex);
            break;

        case DATE_UPLOADED:
            // If the file has no property 'date_uploaded', then the value returned is 0.
            fileDates = sortedFiles.map(file => {
                if (!file.date_uploaded)
                    return 0;
                return Date.parse(file.date_uploaded);
            });
            quickSort(sortedFiles, fileDates, 0, highIndex);
            break;

        case TYPE:
            let fileTypes = sortedFiles.map(file => file.type);
            quickSort(sortedFiles, fileTypes, 0, highIndex);
            break;

        case SIZE:
            let fileSizes = sortedFiles.map(file => file.size);
            quickSort(sortedFiles, fileSizes, 0, highIndex);
            break;

        default:
            return null;
    }

    if (sortDirection === DESCENDING)
        reverse(sortedFiles);

    return sortedFiles;
}

// DEPRECATED SORT FILES FUNCTION
// function sortFiles(/*array*/files, /*string*/sortBy, /*const*/sortDirection) {
//     // Takes in a list of files where each file is in the format {name<string>, date<string>, type<string>, size<int>, src<string>}
//     // Returns the sorted list in the same format.
    
//     /*
//     Size is sorted using integer sorting.
//     If the type between two files is the same, then the filename is compared instead.   
//     */

//     let sorted; 
//     if (sortBy === SIZE) {
//         sorted = files.sort(function(a, b) {
//             if (a.size === b.size)
//                 return a.name.localeCompare(b.name)
//             return a.size - b.size}
//         );
//     }

//     else if (sortBy === DATE_TAKEN) {
//         sorted = files.sort(function(a, b) {
//             if (a["date_taken"] === b["date_taken"])
//                 return a.name.localeCompare(b.name)
//             return Date.parse(a["date_taken"]) - Date.parse(b["date_taken"])
//         });
//     }

//     else if (sortBy === DATE_UPLOADED) {
//         sorted = files.sort(function(a, b) {
//             if (a["date_uploaded"] === b["date_uploaded"])
//                 return a.name.localeCompare(b.name)
//             return Date.parse(a["date_uploaded"]) - Date.parse(b["date_uploaded"])
//         });
//     }

//     else
//         sorted = files.sort(function (a, b) {
//             if (a[sortBy] === b[sortBy])
//                 return a.name.localeCompare(b.name)
//             return a[sortBy].localeCompare(b[sortBy]);
//         });
    
//     if (sortDirection === DESCENDING)
//         sorted.reverse();

//     return sorted;
// }
