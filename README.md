# HAL 

Library for building and rendering HAL resources.

## HAL

The hall express middleware allows for easier rendering of HAL content. There 
are two middleware components: HalProblem and HalRenderer. 

### HalProblem

This middle ware captures exceptions and renders as an 
``application/problem+json`` content type. If the exception is an HTTP exception
the response from the message is used otherwise a 500 response is returned

### HalRenderer 

A middleware which takes a HalResource object and builds the correct response.
A HalResource can contain other HalResources which will be rendered as part 
of the ``__embedded`` property. Each HalResource MUST contain a type which is 
registered as part of the config for the middleware. HalResources MAY also 
contain links. The ``self`` link will always be added. Other links MAY contain
parameter links which will be filled in from the properties of the resource

#### Hal Options

Check the [Hal Schema](src/halSchema.json) for details on the options
currently the ``build_link_header`` is not implemented. If a resource is not 
defined in the options, then the middle ware will return an error.
 
## TO-DO

- [ ] Build in multiple vendor types 
- [ ] Render different entity/collection versions
- [x] Improve query filtering
