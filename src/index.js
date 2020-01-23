/* istanbul ignore file */
/**
 * @fileOverview Entry point for HAL
 */
module.exports = {
    HalResource: require('./halResource').HalResource,
    HalLink: require('./halLink').HalLink,
    halProblem: require('./halProblem'),
    halRender: require('./halRenderer').halRender,
    entityToResource: require('./entityToResource'),
    getDefinitionForEntity: require('./halRenderer').getDefinitionForEntity,
    HAL_MAX_EMBED_LIMIT: require('./halResource').HAL_MAX_EMBED_LIMIT,
};
