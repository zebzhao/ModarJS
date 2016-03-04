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
});