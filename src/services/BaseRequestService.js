import axios from 'axios';

class BaseRequestService {
    constructor() {
        this.executeGetRequest = this.executeGetRequest.bind(this);
        this.executePostRequest = this.executePostRequest.bind(this);
    }

    async executeGetRequest(url) {
        try {
            const response = await axios.get(url);
            if (response.status === 200) {
                return response.data;
            }
            else {
                throw new Error('Error requesting url: ' + url + ', status code: ' + response.status);
            }
        } catch (error) {
            console.error(error);
            throw error;
        }
    }

    async executePostRequest(url, payload) {
        try {
            const response = await axios.post(url, payload);
            if (response.status >= 200 && response.status < 300) {
                return response.data;
            }

            throw new Error('Error requesting url: ' + url + ', status code: ' + response.status);
        } catch (error) {
            console.error(error);
            throw error;
        }
    }
}

export default BaseRequestService;