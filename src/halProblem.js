/**
 * @fileOverview Translates an error into APIProblem
 */
const _ = require('lodash');

/**
 * Builds a APIProblem from an error
 * @param {Object<Error>} error
 * @return {{
 *  headers: {'Content-Type': string},
 *  body: {detail: *, type: string, title: string, status: (*|number)},
 *  statusCode: (*|number)
 * }}
 */
module.exports = (error) => {
    const statusCode = error.statusCode || 500;
    let title = 'Internal Server Error';

    if (statusCode !== 500) {
        title = _.trim(
            error.name.replace('Error', '').replace(/([A-Z])/g, ' $1'),
        );
    }

    const relation = _.upperFirst(_.camelCase(title));
    const body = {
        'type': `http://docs.nterprise.com/docs/api/errors/${relation}`,
        'detail': error.message,
        'status': statusCode,
        'title': title,
    };

    if (error.hasOwnProperty('details')) {
        _.set(body, 'validation_messages', error.details);
    }

    return {
        statusCode: statusCode,
        type: 'application/problem+json',
        body: body,
    };
};
