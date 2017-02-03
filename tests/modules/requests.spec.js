describe('requests.module', function () {
    beforeEach(function(done) {
        modar.initialize('requests').then(function(requests) {
            requests.interceptors = [];  // Clear interceptors from previous tests
            done();
        });
    });

    it('should invoke whenGET on match', function() {
        var mockMethod = jasmine.createSpy('whenGET callback');
        modar.requests.whenGET(/pokemon[1-9]/, mockMethod);
        modar.requests.get('/pokemon1');
        modar.requests.get('/pokemon123');  // Should also call mock.
        modar.requests.get('/pokemon');
        expect(mockMethod).toHaveBeenCalledTimes(2);
    });

    it('should invoke whenDELETE on match', function() {
        var mockMethod = jasmine.createSpy('whenDELETE callback');
        modar.requests.whenDELETE(/\/pokemon/, mockMethod);
        modar.requests.del('/pokemon1');
        expect(mockMethod).toHaveBeenCalledTimes(1);
    });

    it('should invoke whenPOST on match', function() {
        var mockMethod = jasmine.createSpy('whenPOST callback');
        modar.requests.whenPOST(/pokemon[1-9]/, mockMethod);
        modar.requests.post('/pokemon1', {great: 1});
        modar.requests.get('/pokemon');
        expect(mockMethod).toHaveBeenCalledTimes(1);
        expect(mockMethod).toHaveBeenCalledWith(
            JSON.stringify({great: 1}),
            {headers: { 'Content-Type': 'application/json' }, url: '/pokemon1', method: 'POST' });
    });

    it('should invoke whenPATCH on match', function() {
        var mockMethod = jasmine.createSpy('whenPATCH callback');
        modar.requests.whenPATCH(/pokemon/, mockMethod);
        modar.requests.patch('/pokemon1', {great: 1});
        expect(mockMethod).toHaveBeenCalledTimes(1);
        expect(mockMethod).toHaveBeenCalledWith(
            JSON.stringify({great: 1}),
            {headers: { 'Content-Type': 'application/json' }, url: '/pokemon1', method: 'PATCH' });
    });

    it('should invoke whenPUT on match', function() {
        var mockMethod = jasmine.createSpy('whenPUT callback');
        modar.requests.whenPUT(/pokemon/, mockMethod);
        modar.requests.put('/pokemon1', {great: 1});
        expect(mockMethod).toHaveBeenCalledTimes(1);
        expect(mockMethod).toHaveBeenCalledWith(
            JSON.stringify({great: 1}),
            {headers: { 'Content-Type': 'application/json' }, url: '/pokemon1', method: 'PUT' });
    });

    it('should call request response interceptor', function(done) {
        modar.requests.whenPOST(/request\-interceptor\-call/, function() { return [200, {test: 1}]});
        modar.requests.interceptors.push({
            request: function(params, method) {
                expect(params).toEqual({great: 1});
                done();
            }
        });
        modar.requests.post('/request\-interceptor\-call', {great: 1});
    });

    it('should call response interceptor', function(done) {
        modar.requests.whenPUT(/response\-interceptor\-call/, function() { return [200, {}]});
        modar.requests.interceptors.push({
            response: function(response) {
                if (response.responseText == '{}') {
                    done();
                }
            }
        });
        modar.requests.put('/response\-interceptor\-call', {great: 2});
    });

    it('should resolve promise on proxy response', function(done) {
        modar.requests.whenPUT(/resolve\-proxy\-promise/, function() { return [200, {}]});
        modar.requests.put('/resolve\-proxy\-promise', {}).then(function(response) {
            expect(response.responseText).toBe('{}');
            expect(response.status).toBe(200);
            expect(response.statusText).toBe('OK');
            done();
        });
    })
});