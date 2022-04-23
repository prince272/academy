import DOMPurify from 'dompurify';
import htmlToText from 'html-to-text';
import Cookies from 'js-cookie';

// What is the JavaScript version of sleep()?
// source: https://stackoverflow.com/questions/951021/what-is-the-javascript-version-of-sleep
export function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export function preventDefault(cb) {
    return (event, ...others) => {
        event.preventDefault();
        cb(event, ...others);
    }
};

export function stopPropagation(cb) {
    return (event, ...others) => {
        event.stopPropagation();
        cb(event, ...others);
    }
};

// Remove blank attributes from an Object in Javascript
// source: https://stackoverflow.com/questions/286141/remove-blank-attributes-from-an-object-in-javascript#answer-38340730
export function cleanObject(obj) {
    return Object.fromEntries(
        Object.entries(obj)
            .filter(([_, v]) => v != null)
            .map(([k, v]) => [k, v === Object(v) ? removeEmpty(v) : v])
    );
}

// Move an item from one position to another position.
// source: https://stackoverflow.com/questions/5306680/move-an-array-element-from-one-array-position-to-another?rq=1
export function arrayMove(array, fromIndex, toIndex) {
    var element = array[fromIndex];
    array.splice(fromIndex, 1);
    array.splice(toIndex, 0, element);
}

// Move an item from one array to another array.
export function arrayTransfer(fromArray, fromIndex, toIndex, toArray) {
    toArray.splice(toIndex, 0, fromArray.splice(fromIndex, 1)[0]);
}

export { default as matchPath } from './matchPath';

export const stripHtml = htmlToText.compile({
    selectors: [
        { selector: 'h1', options: { uppercase: false } },
        { selector: 'h2', options: { uppercase: false } },
        { selector: 'h3', options: { uppercase: false } },
        { selector: 'h4', options: { uppercase: false } },
        { selector: 'h5', options: { uppercase: false } },
        { selector: 'h6', options: { uppercase: false } },
        { selector: 'table', options: { uppercaseHeaderCells: false } }
    ]
});

export const sanitizeHtml = (str) => {
    return DOMPurify.sanitize(str);
}

// source: 

export function formatNumber(num, digits) {
    const lookup = [
        { value: 1, symbol: "" },
        { value: 1e3, symbol: "k" },
        { value: 1e6, symbol: "M" },
        { value: 1e9, symbol: "G" },
        { value: 1e12, symbol: "T" },
        { value: 1e15, symbol: "P" },
        { value: 1e18, symbol: "E" }
    ];
    const rx = /\.0+$|(\.[0-9]*[1-9])0+$/;
    var item = lookup.slice().reverse().find(function (item) {
        return num >= item.value;
    });
    return item ? (num / item.value).toFixed(digits).replace(rx, "$1") + item.symbol : "0";
}


/**
 * This function allow you to modify a JS Promise by adding some status properties.
 * Based on: http://stackoverflow.com/questions/21485545/is-there-a-way-to-tell-if-an-es6-promise-is-fulfilled-rejected-resolved
 * But modified according to the specs of promises : https://promisesaplus.com/
 */
function MakeQuerablePromise(promise) {
    // Don't modify any promise that has been already modified.
    if (promise.isFulfilled) return promise;

    // Set initial state
    var isPending = true;
    var isRejected = false;
    var isFulfilled = false;

    // Observe the promise, saving the fulfillment in a closure scope.
    var result = promise.then(
        function (v) {
            isFulfilled = true;
            isPending = false;
            return v;
        },
        function (e) {
            isRejected = true;
            isPending = false;
            throw e;
        }
    );

    result.isFulfilled = function () { return isFulfilled; };
    result.isPending = function () { return isPending; };
    result.isRejected = function () { return isRejected; };
    return result;
}

// Asynchronous Locks in Modern Javascript
// source: https://medium.com/@chris_marois/asynchronous-locks-in-modern-javascript-8142c877baf
export class AsyncLocker {
    constructor() {
        this.promises = [];
    }

    createLock() {
        let release;
        this.promises = this.promises.filter(promise => promise.isPending());
        this.promises.push(MakeQuerablePromise(new Promise(resolve => release = resolve)));
        const promise = this.promises[this.promises.length - 2] || MakeQuerablePromise(Promise.resolve());
        return { promise, release };
    }
}

export function CreateLock() {
    let lock = {};
    lock.delay = MakeQuerablePromise(new Promise(resolve => lock.release = resolve));
    return lock;
};


// Download data URL file
// source: https://stackoverflow.com/questions/3916191/download-data-url-file
export function downloadFromUrl(dataUrl, filename) {

    // Construct the 'a' element
    let link = document.createElement("a");
    link.download = filename;
    link.target = "_blank";

    // Construct the URI
    link.href = dataUrl;
    document.body.appendChild(link);
    link.click();

    // Cleanup the DOM
    document.body.removeChild(link);
}

export const getCookie = (cookiename, cookiestring) => {
    var name = cookiename + '=';
    var decodedCookie = decodeURIComponent(cookiestring);
    var ca = decodedCookie.split(';');
    for (var i = 0; i < ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0) === ' ') {
            c = c.substring(1);
        }
        if (c.indexOf(name) === 0) {
            return c.substring(name.length, c.length);
        }
    }
    return '';
};

export const setCookie = (cookiename, cookievalue) => {
    Cookies.set(cookiename, cookievalue, { expires: 365 });
}