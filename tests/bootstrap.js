/**
 * @fileOverview File to bootstrap testing
 */
try {
    const logger = require('@nterprise/common-js').logger;
    const winston = require('winston');
    const fs = require('fs');

    beforeEach(() => {
        logger.clear();
        logger.add(new winston.transports.Stream({
            stream: fs.createWriteStream('/dev/null'),
        }));
    });
} catch (error) {
    // error logging
}
