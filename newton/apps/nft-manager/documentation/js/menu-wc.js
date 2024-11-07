'use strict';

customElements.define('compodoc-menu', class extends HTMLElement {
    constructor() {
        super();
        this.isNormalMode = this.getAttribute('mode') === 'normal';
    }

    connectedCallback() {
        this.render(this.isNormalMode);
    }

    render(isNormalMode) {
        let tp = lithtml.html(`
        <nav>
            <ul class="list">
                <li class="title">
                    <a href="index.html" data-type="index-link">nft-service documentation</a>
                </li>

                <li class="divider"></li>
                ${ isNormalMode ? `<div id="book-search-input" role="search"><input type="text" placeholder="Type to search"></div>` : '' }
                <li class="chapter">
                    <a data-type="chapter-link" href="index.html"><span class="icon ion-ios-home"></span>Getting started</a>
                    <ul class="links">
                        <li class="link">
                            <a href="overview.html" data-type="chapter-link">
                                <span class="icon ion-ios-keypad"></span>Overview
                            </a>
                        </li>
                        <li class="link">
                            <a href="index.html" data-type="chapter-link">
                                <span class="icon ion-ios-paper"></span>README
                            </a>
                        </li>
                                <li class="link">
                                    <a href="dependencies.html" data-type="chapter-link">
                                        <span class="icon ion-ios-list"></span>Dependencies
                                    </a>
                                </li>
                                <li class="link">
                                    <a href="properties.html" data-type="chapter-link">
                                        <span class="icon ion-ios-apps"></span>Properties
                                    </a>
                                </li>
                    </ul>
                </li>
                    <li class="chapter modules">
                        <a data-type="chapter-link" href="modules.html">
                            <div class="menu-toggler linked" data-bs-toggle="collapse" ${ isNormalMode ?
                                'data-bs-target="#modules-links"' : 'data-bs-target="#xs-modules-links"' }>
                                <span class="icon ion-ios-archive"></span>
                                <span class="link-name">Modules</span>
                                <span class="icon ion-ios-arrow-down"></span>
                            </div>
                        </a>
                        <ul class="links collapse " ${ isNormalMode ? 'id="modules-links"' : 'id="xs-modules-links"' }>
                            <li class="link">
                                <a href="modules/AppModule.html" data-type="entity-link" >AppModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                            'data-bs-target="#controllers-links-module-AppModule-b94495f7906501f462b21f5d26e8c6911477d55c6bb80cdd3c36bc50b6f0876c947553c3ca8be2cf4f0bb2b826138ad91b77f66d79c49e4b925887d84471038c"' : 'data-bs-target="#xs-controllers-links-module-AppModule-b94495f7906501f462b21f5d26e8c6911477d55c6bb80cdd3c36bc50b6f0876c947553c3ca8be2cf4f0bb2b826138ad91b77f66d79c49e4b925887d84471038c"' }>
                                            <span class="icon ion-md-swap"></span>
                                            <span>Controllers</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="controllers-links-module-AppModule-b94495f7906501f462b21f5d26e8c6911477d55c6bb80cdd3c36bc50b6f0876c947553c3ca8be2cf4f0bb2b826138ad91b77f66d79c49e4b925887d84471038c"' :
                                            'id="xs-controllers-links-module-AppModule-b94495f7906501f462b21f5d26e8c6911477d55c6bb80cdd3c36bc50b6f0876c947553c3ca8be2cf4f0bb2b826138ad91b77f66d79c49e4b925887d84471038c"' }>
                                            <li class="link">
                                                <a href="controllers/AppController.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >AppController</a>
                                            </li>
                                            <li class="link">
                                                <a href="controllers/MinioController.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >MinioController</a>
                                            </li>
                                        </ul>
                                    </li>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                        'data-bs-target="#injectables-links-module-AppModule-b94495f7906501f462b21f5d26e8c6911477d55c6bb80cdd3c36bc50b6f0876c947553c3ca8be2cf4f0bb2b826138ad91b77f66d79c49e4b925887d84471038c"' : 'data-bs-target="#xs-injectables-links-module-AppModule-b94495f7906501f462b21f5d26e8c6911477d55c6bb80cdd3c36bc50b6f0876c947553c3ca8be2cf4f0bb2b826138ad91b77f66d79c49e4b925887d84471038c"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-AppModule-b94495f7906501f462b21f5d26e8c6911477d55c6bb80cdd3c36bc50b6f0876c947553c3ca8be2cf4f0bb2b826138ad91b77f66d79c49e4b925887d84471038c"' :
                                        'id="xs-injectables-links-module-AppModule-b94495f7906501f462b21f5d26e8c6911477d55c6bb80cdd3c36bc50b6f0876c947553c3ca8be2cf4f0bb2b826138ad91b77f66d79c49e4b925887d84471038c"' }>
                                        <li class="link">
                                            <a href="injectables/AppService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >AppService</a>
                                        </li>
                                    </ul>
                                </li>
                            </li>
                            <li class="link">
                                <a href="modules/MinioModule.html" data-type="entity-link" >MinioModule</a>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                        'data-bs-target="#injectables-links-module-MinioModule-79c7eac28b95e5f8f4246f98f98e549aa46424212888b376cc0594c0ae249083d8c4500a0ca1eb25a51c498194b0bc177d90b2abf257d2e87079d7fa6b07b285"' : 'data-bs-target="#xs-injectables-links-module-MinioModule-79c7eac28b95e5f8f4246f98f98e549aa46424212888b376cc0594c0ae249083d8c4500a0ca1eb25a51c498194b0bc177d90b2abf257d2e87079d7fa6b07b285"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-MinioModule-79c7eac28b95e5f8f4246f98f98e549aa46424212888b376cc0594c0ae249083d8c4500a0ca1eb25a51c498194b0bc177d90b2abf257d2e87079d7fa6b07b285"' :
                                        'id="xs-injectables-links-module-MinioModule-79c7eac28b95e5f8f4246f98f98e549aa46424212888b376cc0594c0ae249083d8c4500a0ca1eb25a51c498194b0bc177d90b2abf257d2e87079d7fa6b07b285"' }>
                                        <li class="link">
                                            <a href="injectables/MinioClientService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >MinioClientService</a>
                                        </li>
                                    </ul>
                                </li>
                            </li>
                            <li class="link">
                                <a href="modules/NFTModule.html" data-type="entity-link" >NFTModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                            'data-bs-target="#controllers-links-module-NFTModule-24acb37d73780ef0a6b0e9c340c0d89594f34d0e61a1bd4023c7d9cb18c15c514dfcfd1850b30cae9f786a278c5c3d8da0a161b459dac33cefe74822dd04d888"' : 'data-bs-target="#xs-controllers-links-module-NFTModule-24acb37d73780ef0a6b0e9c340c0d89594f34d0e61a1bd4023c7d9cb18c15c514dfcfd1850b30cae9f786a278c5c3d8da0a161b459dac33cefe74822dd04d888"' }>
                                            <span class="icon ion-md-swap"></span>
                                            <span>Controllers</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="controllers-links-module-NFTModule-24acb37d73780ef0a6b0e9c340c0d89594f34d0e61a1bd4023c7d9cb18c15c514dfcfd1850b30cae9f786a278c5c3d8da0a161b459dac33cefe74822dd04d888"' :
                                            'id="xs-controllers-links-module-NFTModule-24acb37d73780ef0a6b0e9c340c0d89594f34d0e61a1bd4023c7d9cb18c15c514dfcfd1850b30cae9f786a278c5c3d8da0a161b459dac33cefe74822dd04d888"' }>
                                            <li class="link">
                                                <a href="controllers/NFTController.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >NFTController</a>
                                            </li>
                                        </ul>
                                    </li>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                        'data-bs-target="#injectables-links-module-NFTModule-24acb37d73780ef0a6b0e9c340c0d89594f34d0e61a1bd4023c7d9cb18c15c514dfcfd1850b30cae9f786a278c5c3d8da0a161b459dac33cefe74822dd04d888"' : 'data-bs-target="#xs-injectables-links-module-NFTModule-24acb37d73780ef0a6b0e9c340c0d89594f34d0e61a1bd4023c7d9cb18c15c514dfcfd1850b30cae9f786a278c5c3d8da0a161b459dac33cefe74822dd04d888"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-NFTModule-24acb37d73780ef0a6b0e9c340c0d89594f34d0e61a1bd4023c7d9cb18c15c514dfcfd1850b30cae9f786a278c5c3d8da0a161b459dac33cefe74822dd04d888"' :
                                        'id="xs-injectables-links-module-NFTModule-24acb37d73780ef0a6b0e9c340c0d89594f34d0e61a1bd4023c7d9cb18c15c514dfcfd1850b30cae9f786a278c5c3d8da0a161b459dac33cefe74822dd04d888"' }>
                                        <li class="link">
                                            <a href="injectables/MetaDataService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >MetaDataService</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/NFTService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >NFTService</a>
                                        </li>
                                    </ul>
                                </li>
                            </li>
                            <li class="link">
                                <a href="modules/PrismaCustomModule.html" data-type="entity-link" >PrismaCustomModule</a>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                        'data-bs-target="#injectables-links-module-PrismaCustomModule-3f99be6fe8606232e4ce0712c6ec1e3aa10aafc8fdf37aaf0aff0b441ccb5740f72c40e3101953ef54aab945baa6b6d927b2e88eda9c83666ea5f9b3cb8a57e8"' : 'data-bs-target="#xs-injectables-links-module-PrismaCustomModule-3f99be6fe8606232e4ce0712c6ec1e3aa10aafc8fdf37aaf0aff0b441ccb5740f72c40e3101953ef54aab945baa6b6d927b2e88eda9c83666ea5f9b3cb8a57e8"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-PrismaCustomModule-3f99be6fe8606232e4ce0712c6ec1e3aa10aafc8fdf37aaf0aff0b441ccb5740f72c40e3101953ef54aab945baa6b6d927b2e88eda9c83666ea5f9b3cb8a57e8"' :
                                        'id="xs-injectables-links-module-PrismaCustomModule-3f99be6fe8606232e4ce0712c6ec1e3aa10aafc8fdf37aaf0aff0b441ccb5740f72c40e3101953ef54aab945baa6b6d927b2e88eda9c83666ea5f9b3cb8a57e8"' }>
                                        <li class="link">
                                            <a href="injectables/PrismaService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >PrismaService</a>
                                        </li>
                                    </ul>
                                </li>
                            </li>
                </ul>
                </li>
                    <li class="chapter">
                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ? 'data-bs-target="#classes-links"' :
                            'data-bs-target="#xs-classes-links"' }>
                            <span class="icon ion-ios-paper"></span>
                            <span>Classes</span>
                            <span class="icon ion-ios-arrow-down"></span>
                        </div>
                        <ul class="links collapse " ${ isNormalMode ? 'id="classes-links"' : 'id="xs-classes-links"' }>
                            <li class="link">
                                <a href="classes/ErrorWithData.html" data-type="entity-link" >ErrorWithData</a>
                            </li>
                            <li class="link">
                                <a href="classes/NftCollection.html" data-type="entity-link" >NftCollection</a>
                            </li>
                            <li class="link">
                                <a href="classes/NftItem.html" data-type="entity-link" >NftItem</a>
                            </li>
                            <li class="link">
                                <a href="classes/OnTon.html" data-type="entity-link" >OnTon</a>
                            </li>
                        </ul>
                    </li>
                    <li class="chapter">
                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ? 'data-bs-target="#interfaces-links"' :
                            'data-bs-target="#xs-interfaces-links"' }>
                            <span class="icon ion-md-information-circle-outline"></span>
                            <span>Interfaces</span>
                            <span class="icon ion-ios-arrow-down"></span>
                        </div>
                        <ul class="links collapse " ${ isNormalMode ? ' id="interfaces-links"' : 'id="xs-interfaces-links"' }>
                            <li class="link">
                                <a href="interfaces/AccountStateAfter.html" data-type="entity-link" >AccountStateAfter</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/AccountStateBefore.html" data-type="entity-link" >AccountStateBefore</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/AdditionalProp1.html" data-type="entity-link" >AdditionalProp1</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/AdditionalProp2.html" data-type="entity-link" >AdditionalProp2</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/AdditionalProp3.html" data-type="entity-link" >AdditionalProp3</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/AddressBook.html" data-type="entity-link" >AddressBook</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/BlockRef.html" data-type="entity-link" >BlockRef</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/Collection.html" data-type="entity-link" >Collection</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/CollectionContent.html" data-type="entity-link" >CollectionContent</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/CollectionDeployment.html" data-type="entity-link" >CollectionDeployment</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/CollectionDTO.html" data-type="entity-link" >CollectionDTO</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/CollectionFiles.html" data-type="entity-link" >CollectionFiles</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/CollectionMetadata.html" data-type="entity-link" >CollectionMetadata</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/Content.html" data-type="entity-link" >Content</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/Decoded.html" data-type="entity-link" >Decoded</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/FixOrdersData.html" data-type="entity-link" >FixOrdersData</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/GetNftResponse.html" data-type="entity-link" >GetNftResponse</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/GetOrderResponse.html" data-type="entity-link" >GetOrderResponse</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/GetTransactionsResponse.html" data-type="entity-link" >GetTransactionsResponse</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/InitState.html" data-type="entity-link" >InitState</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/InitState2.html" data-type="entity-link" >InitState2</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/InMsg.html" data-type="entity-link" >InMsg</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/ItemDTO.html" data-type="entity-link" >ItemDTO</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/ItemMetaData.html" data-type="entity-link" >ItemMetaData</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/MessageContent.html" data-type="entity-link" >MessageContent</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/MessageContent2.html" data-type="entity-link" >MessageContent2</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/NftItem.html" data-type="entity-link" >NftItem</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/NftItemData.html" data-type="entity-link" >NftItemData</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/OutMsg.html" data-type="entity-link" >OutMsg</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/participantData.html" data-type="entity-link" >participantData</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/Transaction.html" data-type="entity-link" >Transaction</a>
                            </li>
                        </ul>
                    </li>
                    <li class="chapter">
                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ? 'data-bs-target="#miscellaneous-links"'
                            : 'data-bs-target="#xs-miscellaneous-links"' }>
                            <span class="icon ion-ios-cube"></span>
                            <span>Miscellaneous</span>
                            <span class="icon ion-ios-arrow-down"></span>
                        </div>
                        <ul class="links collapse " ${ isNormalMode ? 'id="miscellaneous-links"' : 'id="xs-miscellaneous-links"' }>
                            <li class="link">
                                <a href="miscellaneous/functions.html" data-type="entity-link">Functions</a>
                            </li>
                            <li class="link">
                                <a href="miscellaneous/typealiases.html" data-type="entity-link">Type aliases</a>
                            </li>
                            <li class="link">
                                <a href="miscellaneous/variables.html" data-type="entity-link">Variables</a>
                            </li>
                        </ul>
                    </li>
                    <li class="chapter">
                        <a data-type="chapter-link" href="coverage.html"><span class="icon ion-ios-stats"></span>Documentation coverage</a>
                    </li>
                    <li class="divider"></li>
                    <li class="copyright">
                        Documentation generated using <a href="https://compodoc.app/" target="_blank" rel="noopener noreferrer">
                            <img data-src="images/compodoc-vectorise.png" class="img-responsive" data-type="compodoc-logo">
                        </a>
                    </li>
            </ul>
        </nav>
        `);
        this.innerHTML = tp.strings;
    }
});