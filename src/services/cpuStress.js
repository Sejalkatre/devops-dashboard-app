function generateLoad(seconds) {

    const end = Date.now() + (seconds * 1000);

    while (Date.now() < end) {

        let result = 0;

        for (let i = 0; i < 100000; i++) {
            result += Math.sqrt(i);
        }
    }

    return true;
}

module.exports = {
    generateLoad
};
