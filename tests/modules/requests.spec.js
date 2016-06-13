describe('requests.module', function () {
    beforeEach(function(done) {
        pyscript.initialize('requests').then(function() {
            done();
        });
    });

    it('mock all request methods', function() {
        var requests = pyscript.requests;
        var testUrl = "www.test.url.com.y";
        requests.mockSetup();
        expect(requests.get(testUrl, {}).then).toBeDefined();
        expect(requests.del(testUrl, {}).then).toBeDefined();
        expect(requests.post(testUrl, {}, {}).then).toBeDefined();
        expect(requests.patch(testUrl, {}, {}).then).toBeDefined();
        expect(requests.put(testUrl, {}, {}).then).toBeDefined();
        expect(requests.upload(testUrl, {}).then).toBeDefined();
        expect(requests.get).toHaveBeenCalledWith(testUrl, {});
        expect(requests.del).toHaveBeenCalledWith(testUrl, {});
        expect(requests.post).toHaveBeenCalledWith(testUrl, {}, {});
        expect(requests.patch).toHaveBeenCalledWith(testUrl, {}, {});
        expect(requests.put).toHaveBeenCalledWith(testUrl, {}, {});
        expect(requests.upload).toHaveBeenCalledWith(testUrl, {});
    });


    it('should process and return response from server', function(done) {
        var requests = pyscript.requests;
        var testUrl = "nice";
        requests.mockSetup();
        requests.mockServer.defRoute('get', testUrl, function() {
            return {responseText: "nice-response"};
        });

        requests.get(testUrl).then(function() {
            expect(this.responseText).toBe("nice-response");
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
});