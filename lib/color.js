(function () {
    window.color = {
        identity: identity,
        getset: getset,
    }

    function identity ( v ) { 
        return v;
    }

    function getset ( options, key ) {
        var setter, getter = identity;
        var fn = function ( value ) {
            if ( arguments.length == 0 ) {
                return getter( options[ key ] );
            }

            options[ key ] = value;
            if ( setter ) {
                setter.call( this, value );
            }
            return this;
        }

        fn.set = function ( _setter ) { 
            setter = _setter 
            return this;
        }

        fn.get = function ( _getter ) {
            getter = _getter;
            return this;
        }
        return fn;
    }
})();
