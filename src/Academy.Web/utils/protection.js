import CryptoJS from "crypto-js";

export default {
    encrypt: (key, plainText) => {
        // Encrypt
        let ciphertext = CryptoJS.AES.encrypt(plainText, key).toString();
        return ciphertext;
    },
    decrypt: (key, cipheredText) => {
        // var parsedBase64Key = CryptoJS.enc.Base64.parse(key);

        // var decryptedData = CryptoJS.AES.decrypt( cipheredText, parsedBase64Key);

        // Decrypt
        let bytes = CryptoJS.AES.decrypt(cipheredText, key);
        let decryptedText = bytes.toString(CryptoJS.enc.Utf8);
        // var decryptedText = decryptedData.toString( CryptoJS.enc.Utf8 );
        return decryptedText;
    }
}