/**
 * @fileOverview Test for the HalEntity
 */

const {expect} = require('chai');
const {halProblem} = require('../src');
const httpErrors = require('http-errors');

describe('HAL Problem', () => {
    it('Should return internal server error on generic error', () => {
        expect(halProblem(new Error('Failed'))).deep.eq({
            statusCode: 500,
            type: 'application/problem+json',
            body: {
                'detail': 'Failed',
                'status': 500,
                'title': 'Internal Server Error',
                'type': 'http://docs.nterprise.com/docs/api/errors/InternalServerError',
            },
        });
    });

    it('Should return Bad Request error on BadRequest', () => {
        expect(halProblem(new httpErrors.BadRequest('Missing foo'))).deep.eq({
            statusCode: 400,
            type: 'application/problem+json',
            body: {
                'detail': 'Missing foo',
                'status': 400,
                'title': 'Bad Request',
                'type': 'http://docs.nterprise.com/docs/api/errors/BadRequest',
            },
        });
    });

    it('Should add validation messages', () => {
        const error = new httpErrors.BadRequest('Missing foo');
        error.details = [
            {
                'fizz': 'buzz',
            },
        ];

        expect(halProblem(error)).deep.eq({
            statusCode: 400,
            type: 'application/problem+json',
            body: {
                'detail': 'Missing foo',
                'status': 400,
                'title': 'Bad Request',
                'type': 'http://docs.nterprise.com/docs/api/errors/BadRequest',
                'validation_messages': [
                    {
                        'fizz': 'buzz',
                    },
                ],
            },
        });
    });
});
