jQuery( document ).ready(function( $ ) {
  // Initialize jQuery UI Tabs
  $('#tabs').tabs();

  // Optional: To handle switching between tabs programmatically
  $('#tabs').on('tabsactivate', function(event, ui) {
    console.log('Switched to tab:', ui.newTab.find('a').text());
  });

  blueprintBuilder = {

    // Update the PHP version number.
    phpVersionChange: function( e ) {
      let phpVersion = jQuery( e.target ).val();
      let bluePrint = jQuery( '.blueprint-json' ).val();

      // Use regex to replace any value next to "php".
      let jsonData = bluePrint.replace(/("php"\s*:\s*)".*?"/g, `$1"${phpVersion}"` );

      blueprintBuilder.updateBlueprintJson( JSON.parse( jsonData ) );
    },

    // Update the WordPress version number.
    wpVersionChange: function( e ) {
      let wpVersion = jQuery( e.target ).val();
      let bluePrint = jQuery( '.blueprint-json' ).val();

      // Use regex to replace any value next to "wp".
      let jsonData = bluePrint.replace(/("wp"\s*:\s*)".*?"/g, `$1"${wpVersion}"` );

      blueprintBuilder.updateBlueprintJson( JSON.parse( jsonData ) );
    },

    searchPlugins: function( e ) {
      e.preventDefault();

      let plugin = jQuery( '#plugin-search' ).val().trim();

      if ( '' === plugin ) {
        return;
      }

      jQuery( '#plugin-results .results' ).html( '' );
      jQuery( '.plugin-preloader' ).removeClass( 'hidden' );

      let bluePrint = jQuery( '.blueprint-json' ).val();
      let jsonData = JSON.parse( bluePrint );

      $.ajax( {
        type: 'GET',
        url: 'https://api.wordpress.org/plugins/info/1.2/?action=query_plugins&request[page]=1&request[per_page]=400&request[search]=' + plugin,
        success: function( response ) {
          if ( ! Object.keys( response.plugins ).length ) {
            jQuery( '#plugin-results .results' ).html( 'No plugins found.' );
            return;
          }
          let pluginHtml = '';
          for ( let key in response.plugins ) {
            let currentPlugin = response.plugins[ key ];
            let addRemoveClass = 'add-plugin';
            let addRemoveText = 'Add Plugin';

            for ( let i = 0; i < jsonData.steps.length; i++ ) {
              if ( jsonData.steps[i].pluginZipFile && jsonData.steps[i].pluginZipFile.slug === currentPlugin.slug ) {
                addRemoveClass = 'remove-plugin';
                addRemoveText = 'Remove Plugin';
                break;
              }
            }

            pluginHtml += '<div class="plugin">' +
              '<img src="' + ( currentPlugin.icons[ ( Object.keys( currentPlugin.icons ) ).pop() ] ?? "" ) + '" class="icon" />' +
              '<div class="content">' +
                '<h3>' + currentPlugin.name + '</h3>' +
                '<p>' + currentPlugin.short_description + '</p>' +
                '<button class="' + addRemoveClass + '" data-slug="' + currentPlugin.slug + '" data-name="' + currentPlugin.name + '">' + addRemoveText + '</button>' +
              '</div>' +
            '</div>';
          }
          jQuery( '.plugin-preloader' ).addClass( 'hidden' );
          jQuery( '#plugin-results .results' ).html( pluginHtml );
        },
        error: function( error ) {
          jQuery( '.plugin-preloader' ).addClass( 'hidden' );
          jQuery( '#plugin-results .results' ).html( 'An error occurred. Please try again.' );
        }
      } );
    },

    searchThemes: function( e ) {
      e.preventDefault();
      let theme = jQuery( '#theme-search' ).val().trim();
      if ( '' === theme ) {
        return;
      }

      let bluePrint = jQuery( '.blueprint-json' ).val();
      let jsonData = JSON.parse( bluePrint );

      jQuery( '#theme-results .results' ).html( '' );
      jQuery( '.theme-preloader' ).removeClass( 'hidden' );

      $.ajax( {
        type: 'GET',
        url: 'https://api.wordpress.org/themes/info/1.1/?action=query_themes&request[search]=' + theme,
        success: function( response ) {
          console.log( response );
          if ( ! Object.keys( response.themes ).length ) {
            jQuery( '#plugin-results .results' ).html( 'No themes found.' );
            return;
          }

          let themeHtml = '';

          for ( let key in response.themes ) {
            let currentTheme = response.themes[ key ];
            let addRemoveClass = 'add-theme';
            let addRemoveText = 'Add Theme';

            for ( let i = 0; i < jsonData.steps.length; i++ ) {
              if ( jsonData.steps[i].themeZipFile && jsonData.steps[i].themeZipFile.slug === currentTheme.slug ) {
                addRemoveClass = 'remove-theme';
                addRemoveText = 'Remove Theme';
                break;
              }
            }

            themeHtml += '<div class="theme">' +
              '<img src="' + ( currentTheme['screenshot_url'] ?? "" ) + '" class="icon" />' +
              '<div class="content">' +
                '<h3>' + currentTheme.name + '</h3>' +
                '<p>' + currentTheme.description + '</p>' +
                '<button class="' + addRemoveClass + '" data-slug="' + currentTheme.slug + '" data-name="' + currentTheme.name + '">' + addRemoveText + '</button>' +
              '</div>' +
            '</div>';
          }

          jQuery( '.theme-preloader' ).addClass( 'hidden' );
          jQuery( '#theme-results .results' ).html( themeHtml );
        },
        error: function( error ) {
          console.log( error );
          jQuery( '.theme-preloader' ).addClass( 'hidden' );
          jQuery( '#theme-results .results' ).html( 'An error occurred. Please try again.' );
        }
      } );
    },

    addPluginToBlueprint: function( e ) {
      e.preventDefault();
      let slug = jQuery( e.target ).data( 'slug' );
      let name = jQuery( e.target ).data( 'name' );
      let bluePrint = jQuery( '.blueprint-json' ).val();
      let jsonData = JSON.parse( bluePrint );

      jsonData.steps.push( blueprintBuilder.getStep( 'install-plugin', slug ) );

      blueprintBuilder.addStepElement( 'install-plugin', name, slug );

      blueprintBuilder.updateBlueprintJson( jsonData );

      addPluginModal.dialog( 'close' );

      jQuery( e.target ).html( 'Remove Plugin' ).removeClass( 'add-plugin' ).addClass( 'remove-plugin' );
    },

    addThemeToBlueprint: function( e ) {
      e.preventDefault();
      let slug = jQuery( e.target ).data( 'slug' );
      let name = jQuery( e.target ).data( 'name' );
      let bluePrint = jQuery( '.blueprint-json' ).val();
      let jsonData = JSON.parse( bluePrint );

      jsonData.steps.push( blueprintBuilder.getStep( 'install-theme', slug ) );

      blueprintBuilder.addStepElement( 'install-theme', name, slug );

      blueprintBuilder.updateBlueprintJson( jsonData );

      addThemeModal.dialog( 'close' );

      jQuery( e.target ).html( 'Remove Theme' ).removeClass( 'add-theme' ).addClass( 'remove-theme' );
    },

    removePluginFromBlueprint: function( e ) {
      e.preventDefault();
      let plugin = jQuery( e.target ).data( 'slug' );
      let bluePrint = jQuery( '.blueprint-json' ).val();
      let jsonData = JSON.parse( bluePrint );

      let steps = jsonData.steps;

      for ( let i = 0; i < steps.length; i++ ) {
        if ( steps[i].pluginZipFile && steps[i].pluginZipFile.slug === plugin ) {
          steps.splice( i, 1 );
          break;
        }
      }

      if ( jQuery( '#blueprint-fields li[data-slug="' + plugin + '"]' ).length ) {
        jQuery( '#blueprint-fields li[data-slug="' + plugin + '"] .delete-step' ).click();
      }

      blueprintBuilder.updateBlueprintJson( jsonData );

      jQuery( e.target ).html( 'Add Plugin' ).removeClass( 'remove-plugin' ).addClass( 'add-plugin' );
    },

    removeThemeFromBlueprint: function( e ) {
      e.preventDefault();
      let theme = jQuery( e.target ).data( 'slug' );
      let bluePrint = jQuery( '.blueprint-json' ).val();
      let jsonData = JSON.parse( bluePrint );

      let steps = jsonData.steps;

      for ( let i = 0; i < steps.length; i++ ) {
        if ( steps[i].themeZipFile && steps[i].themeZipFile.slug === theme ) {
          steps.splice( i, 1 );
          break;
        }
      }

      if ( jQuery( '#blueprint-fields li[data-slug="' + theme + '"]' ).length ) {
        jQuery( '#blueprint-fields li[data-slug="' + theme + '"] .delete-step' ).click();
      }

      blueprintBuilder.updateBlueprintJson( jsonData );

      jQuery( e.target ).html( 'Add Theme' ).removeClass( 'remove-theme' ).addClass( 'add-theme' );
    },

    testBluePrint: function( e ) {
      e.preventDefault();
      let bluePrintString = btoa( jQuery( '.blueprint-json' ).val() );
      window.open( 'https://playground.wordpress.net/#' + bluePrintString, '_blank' );
    },

    duplicateRow: function( e ) {
      e.preventDefault();
      let row = jQuery( e.target ).parent( '.duplicate' );
      row.clone().insertAfter( row );
      jQuery( this ).css( { 'opacity': 0, 'z-index': '-5' } ).attr( 'disabled', 'disabled' );
      jQuery( '.site-options .duplicate:last-child' ).find( 'input' ).val( '' );
    },

    deleteStep: function( e ) {
      e.preventDefault();

      var confirmLeave = confirm( 'Are you sure you want to delete this blueprint step?' );

      if ( confirmLeave !== true ) {
        return;
      }

      jQuery( e.target ).closest( 'li' ).fadeOut( 'fast', function() {
        let step = jQuery( this ).data( 'step' );

        // Reset the remove buttons in the modals.
        if ( [ 'install-plugin', 'install-theme' ].includes( step ) ) {
          let slug = jQuery( this ).data( 'slug' );

          if ( jQuery( '#install-plugin-modal .remove-plugin[data-slug="' + slug + '"]' ).length ) {
            jQuery( '#install-plugin-modal .remove-plugin[data-slug="' + slug + '"]' ).html( 'Add Plugin' ).removeClass( 'remove-plugin' ).addClass( 'add-plugin' );
          }

          if ( jQuery( '#install-theme-modal .remove-theme[data-slug="' + slug + '"]' ).length ) {
            jQuery( '#install-theme-modal .remove-theme[data-slug="' + slug + '"]' ).html( 'Remove Theme' ).removeClass( 'remove-theme' ).addClass( 'add-theme' );
          }
        }

        jQuery( this ).remove();

        if ( ! jQuery( '.step-list li' ).length ) {
          jQuery( '#blueprint-fields h3' ).show();
        }

        blueprintBuilder.regenerateBlueprint();
      } );
    },

    updateBlueprintJson: function( jsonData ) {
      jQuery( '.blueprint-json' ).val( JSON.stringify( jsonData, null, 2 ) );
    },

    addStepElement: function( step, name, slug = '', options = {} ) {
      if ( jQuery( '#blueprint-fields' ).find( 'h3' ).length ) {
        jQuery( '#blueprint-fields h3' ).hide();
      }

      let text = '';

      switch ( step ) {
        case 'install-plugin':
          text = `Install Plugin - ${name}`;
          break;
        case 'install-theme':
          text = `Install Theme - ${name}`;
          break;
        case 'set-site-options':
          text = `Set Site Options - ${name}`;
          break;
      }

      options = JSON.stringify( options );
      jQuery( '.step-list' ).append( `<li class="grab" data-slug="${slug}" data-step="${step}" data-options='${options}'>${text}<button class="delete-step"><span class="ui-icon ui-icon-close"></span></button></li>` );
    },

    addStep: function( e ) {
      e.preventDefault();

      let step = jQuery( e.target ).data( 'step' );

      switch ( step ) {
        case 'install-plugin':
          addPluginModal.dialog( 'open' );
          break;
        case 'install-theme':
          addThemeModal.dialog( 'open' );
          break;
        case 'set-site-options':
          setSiteOptionsModal.dialog( 'open' );
          break;
      }

    },

    getStep: function( step, slug = '', options = {} ) {

      switch ( step ) {

        case 'login':
          return {
            "step": "login",
            "username": "admin",
            "password": "password"
          };

        case 'install-plugin':
          return {
            "step": "installPlugin",
            "pluginZipFile": {
              "resource": "wordpress.org/plugins",
              "slug": slug
            },
            "options": {
              "activate": true
            }
          };

        case 'install-theme':
          return {
            "step": "installTheme",
            "themeZipFile": {
              "resource": "wordpress.org/themes",
              "slug": slug
            }
          };

        case 'set-site-options':
          return {
            "step": "setSiteOptions",
            "options": options
          };
      }

    },

    regenerateBlueprint: function() {
      let bluePrint = jQuery( '.blueprint-json' ).val();
      let jsonData = JSON.parse( bluePrint );

      let steps = [];
      let options = {};

      // Login should always be first.
      steps.push( blueprintBuilder.getStep( 'login' ) );

      $( '.step-list li' ).each( function( index, element ) {
        let step = jQuery( element ).data( 'step' );
        let slug = jQuery( element ).data( 'slug' );

        if ( [ 'set-site-options' ].includes( step ) ) {
          options = jQuery( element ).data( 'options' );
        }

        console.log( options );

        steps.push( blueprintBuilder.getStep( step, slug, options ) );
      } );

      jsonData.steps = steps;

      blueprintBuilder.updateBlueprintJson( jsonData );
    },

    copyToClipboard: function() {
      var blueprintConfig = jQuery( '.blueprint-json' ).val();

      navigator.clipboard.writeText( blueprintConfig ).then( function() {
        alert( 'Copied to clipboard!' );
      }, function( err ) {
        console.error( 'Failed to copy: ', err );
      } );
    }

  };

  jQuery( '#php-version' ).on( 'change', blueprintBuilder.phpVersionChange );
  jQuery( '#wp-version' ).on( 'change', blueprintBuilder.wpVersionChange );

  jQuery( 'button#plugin-search-button' ).on( 'click', blueprintBuilder.searchPlugins );
  jQuery( 'button#theme-search-button' ).on( 'click', blueprintBuilder.searchThemes );

  jQuery( document ).on( 'click', '.add-plugin', blueprintBuilder.addPluginToBlueprint );
  jQuery( document ).on( 'click', '.remove-plugin', blueprintBuilder.removePluginFromBlueprint );

  jQuery( document ).on( 'click', '.add-theme', blueprintBuilder.addThemeToBlueprint );
  jQuery( document ).on( 'click', '.remove-theme', blueprintBuilder.removeThemeFromBlueprint );

  jQuery( document ).on( 'click', 'button.duplicate-row', blueprintBuilder.duplicateRow );

  jQuery( document ).on( 'click', '.delete-step', blueprintBuilder.deleteStep );

  jQuery( document ).on( 'click', '.copy-blueprint', blueprintBuilder.copyToClipboard );

  jQuery( 'a.step' ).on( 'click', blueprintBuilder.addStep );

  jQuery( 'a.test-blueprint' ).on( 'click', blueprintBuilder.testBluePrint );

  // Initialize the Modals
  let addPluginModal = $( "#install-plugin-modal" ).dialog( {
    autoOpen: false,
    height: 600,
    width: '50%',
    modal: true,
    resizable: false,
    draggable: false,
    buttons: {
      Cancel: function() {
        addPluginModal.dialog( "close" );
      }
    }
  } );

  let addThemeModal = $( "#install-theme-modal" ).dialog( {
    autoOpen: false,
    height: 600,
    width: '50%',
    modal: true,
    resizable: false,
    draggable: false,
    buttons: {
      Cancel: function() {
        addThemeModal.dialog( "close" );
      }
    }
  } );

  let setSiteOptionsModal = $( "#set-site-options-modal" ).dialog( {
    autoOpen: false,
    height: 600,
    width: '50%',
    modal: true,
    resizable: false,
    draggable: false,
    close:  function() {
      jQuery( '#set-site-options-modal .site-options .duplicate:not(:last-child)' ).remove();
      jQuery( '#set-site-options-modal .duplicate:last-child input[type="text"]' ).val('');
    },
    buttons: {
      "Set Site Options": function() {
        let options = {};
        $( '#set-site-options-modal .duplicate' ).each( function( index, element ) {
          let optionName = jQuery( element ).find( '.option-name' ).val();
          let optionValue = jQuery( element ).find( '.option-value' ).val();

          if ( '' === optionName.trim() && '' === optionValue.trim() ) {
            return true;
          }

          options[ optionName ] = optionValue;
        } );

        if ( ! Object.keys( options ).length ) {
          setSiteOptionsModal.dialog( "close" );
          return;
        }

        let bluePrint = jQuery( '.blueprint-json' ).val();
        let jsonData = JSON.parse( bluePrint );

        jsonData.steps.push( blueprintBuilder.getStep( 'set-site-options', '', options ) );

        blueprintBuilder.addStepElement( 'set-site-options', JSON.stringify( options ), '', options );
        blueprintBuilder.updateBlueprintJson( jsonData );

        jQuery( '#set-site-options-modal .site-options .duplicate:not(:last-child)' ).remove();
        jQuery( '#set-site-options-modal .duplicate:last-child input[type="text"]' ).val('');

        setSiteOptionsModal.dialog( "close" );
      },
      Cancel: function() {
        jQuery( '#set-site-options-modal .site-options .duplicate:not(:last-child)' ).remove();
        jQuery( '#set-site-options-modal .duplicate:last-child input[type="text"]' ).val('');
        setSiteOptionsModal.dialog( "close" );
      }
    }
  } );

  // Initialize sortable/draggable
  $( ".step-list" ).sortable( {
    revert: true,
    placeholder: "sortable-placeholder",
    axis: "y",
    cursor: "grabbing",
    start: function(e, ui) {
      ui.placeholder.height(ui.item.height());
      ui.placeholder.width(ui.item.width());
    },
    stop: function() {
      blueprintBuilder.regenerateBlueprint();
    }
  } );
} );
