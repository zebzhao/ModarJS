describe('requests.module', function () {
    beforeEach(function(done) {
        pyscript.initialize('requests').then(function(requests) {
            requests.interceptors = [];  // Clear interceptors from previous tests
            done();
        });
    });

    it('should invoke whenGET on match', function() {
        var mockMethod = jasmine.createSpy('whenGET callback');
        pyscript.requests.whenGET(/pokemon[1-9]/, mockMethod);
        pyscript.requests.get('/pokemon1');
        pyscript.requests.get('/pokemon123');  // Should also call mock.
        pyscript.requests.get('/pokemon');
        expect(mockMethod).toHaveBeenCalledTimes(2);
    });

    it('should invoke whenDELETE on match', function() {
        var mockMethod = jasmine.createSpy('whenDELETE callback');
        pyscript.requests.whenDELETE(/\/pokemon/, mockMethod);
        pyscript.requests.del('/pokemon1');
        expect(mockMethod).toHaveBeenCalledTimes(1);
    });

    it('should invoke whenPOST on match', function() {
        var mockMethod = jasmine.createSpy('whenPOST callback');
        pyscript.requests.whenPOST(/pokemon[1-9]/, mockMethod);
        pyscript.requests.post('/pokemon1', {great: 1});
        pyscript.requests.get('/pokemon');
        expect(mockMethod).toHaveBeenCalledTimes(1);
        expect(mockMethod).toHaveBeenCalledWith(
            JSON.stringify({great: 1}),
            {headers: { 'Content-Type': 'application/json' }, url: '/pokemon1', method: 'POST' });
    });

    it('should invoke whenPATCH on match', function() {
        var mockMethod = jasmine.createSpy('whenPATCH callback');
        pyscript.requests.whenPATCH(/pokemon/, mockMethod);
        pyscript.requests.patch('/pokemon1', {great: 1});
        expect(mockMethod).toHaveBeenCalledTimes(1);
        expect(mockMethod).toHaveBeenCalledWith(
            JSON.stringify({great: 1}),
            {headers: { 'Content-Type': 'application/json' }, url: '/pokemon1', method: 'PATCH' });
    });

    it('should invoke whenPUT on match', function() {
        var mockMethod = jasmine.createSpy('whenPUT callback');
        pyscript.requests.whenPUT(/pokemon/, mockMethod);
        pyscript.requests.put('/pokemon1', {great: 1});
        expect(mockMethod).toHaveBeenCalledTimes(1);
        expect(mockMethod).toHaveBeenCalledWith(
            JSON.stringify({great: 1}),
            {headers: { 'Content-Type': 'application/json' }, url: '/pokemon1', method: 'PUT' });
    });

    it('should call request response interceptor', function(done) {
        pyscript.requests.whenPOST(/request\-interceptor\-call/, function() { return [200, {test: 1}]});
        pyscript.requests.interceptors.push({
            request: function(params, method) {
                expect(params).toEqual({great: 1});
                done();
            }
        });
        pyscript.requests.post('/request\-interceptor\-call', {great: 1});
    });

    it('should call response interceptor', function(done) {
        pyscript.requests.whenPUT(/response\-interceptor\-call/, function() { return [200, {}]});
        pyscript.requests.interceptors.push({
            response: function(response) {
                if (response.responseText == '{}') {
                    done();
                }
            }
        });
        pyscript.requests.put('/response\-interceptor\-call', {great: 2});
    });

    it('should resolve promise on proxy response', function(done) {
        pyscript.requests.whenPUT(/resolve\-proxy\-promise/, function() { return [200, {}]});
        pyscript.requests.put('/resolve\-proxy\-promise', {}).then(function(response) {
            expect(response.responseText).toBe('{}');
            expect(response.status).toBe(200);
            expect(response.statusText).toBe('OK');
            done();
        });
    })
});