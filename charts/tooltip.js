(function () {
    var color = window.color;
    var getset = color.getset;

    var colorDark = {
        "extends": "dark",
        borderWidth: false,
        background: "rgba(0,0,0,.4)",
        shadowColor: "rgba(0, 0, 0, 0.15)",
        stemLength: 3,
        borderRadius: 15,
    }

    if ( window.Opentip ) {
        window.Opentip.styles.colorDark = colorDark;
    }

    color.tooltip = function () {
        var options = {
            value: null,
            label: null,
            title: null,
            y: null,
            v: null,
        }

        function tooltip ( el ) { tooltip.draw( el ) }
        tooltip.title = getset( options, "title" );
        tooltip.content = getset( options, "content" );
        tooltip.color = getset( options, "c" );
        tooltip.draw = function ( els ) {
            var title = this.title();
            if ( typeof title != "function" ) {
                title = (function ( d ) {
                    return d[ this.title() ] 
                }).bind( this )
            }

            var content = this.content();
            if ( typeof content != "function" ) {
                content = (function ( d ) {
                    return this.content() 
                }).bind( this )
            }

            els.each( function ( d ) {
                if ( !this.__tooltip ) {
                    this.__tooltip = new Opentip( this, "Hello", {
                        showOn: "mouseover",
                        hideOn: "mouseleave",
                        removeElementsOnHide: true
                    });
                }

                this.__tooltip.setContent([
                    "<h3 style='margin: 0'>" + title( d ) + "</h3>",
                    content( d )
                ].join( "<br />" ) );
            })
        }

        return tooltip;
    }

})();
