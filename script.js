// --- Globální stav aplikace ---
        let activeSection = 'about'; // Výchozí aktivní sekce
        let galleryImagesData = [];  // Pole pro ukládání dat obrázků galerie
        let currentModalImageIndex = 0; // Index aktuálně zobrazeného obrázku v modalu

        // Výchozí obrázky pro galerii, pokud localStorage je prázdný
        const initialImageUrls = [ 
            { id: 'initial-1', url: 'https://img41.rajce.idnes.cz/d4102/19/19244/19244630_db82ad174937335b1a151341387b7af2/images/snowy-landscape-with-mountains-lake-with-snow-ground.jpg?ver=0', name: 'Zasněžená krajina'},
            { id: 'initial-2', url: 'https://img41.rajce.idnes.cz/d4102/19/19244/19244630_db82ad174937335b1a151341387b7af2/images/misurina-sunset.jpg?ver=0', name: 'Západ slunce Misurina'},
            { id: 'initial-3', url: 'https://img41.rajce.idnes.cz/d4102/19/19244/19244630_db82ad174937335b1a151341387b7af2/images/image_15360x86401.jpg?ver=0', name: 'Abstraktní obrazec'}
        ];
        
        // Data pro externí odkazy
        const externalLinksData = [
            { title: 'Claude AI', url: 'https://claude.ai/' }, { title: 'SledujSerialy', url: 'https://sledujserialy.sx/' },
            { title: 'Kukaj.me', url: 'https://serial.kukaj.me/' }, { title: 'ProSebe.cz', url: 'https://prosebe.cz/user/project' },
            { title: 'Populace.cz', url: 'https://www.populace.cz' }, { title: 'My-Map.eu', url: 'https://www.my-map.eu/odmeny' },
            { title: 'Národní Panel', url: 'https://www.narodnipanel.cz/?backlink=expx2' }, { title: 'Lifepoints Panel', url: 'https://app.lifepointspanel.com/en-US/login' },
            { title: 'Voyo', url: 'https://voyo.nova.cz/' }, { title: 'Přehraj.to', url: 'https://prehrajto.cz/' },
            { title: 'SledovaniTV.cz', url: 'https://sledovanitv.cz/' }, { title: 'Bombuj', url: 'https://www.bombuj.si/' },
        ];

        // --- Inicializace aplikace ---
        // Tato funkce je nyní volána přímo, protože nečekáme na Firebase
        function initializeAppContent() {
            console.log("Initializing app content (local storage version)...");
            setupNavigation();
            setupHtmlEditor();
            setupGallery();
            renderExternalLinks();
            
            renderSavedCodes(loadHtmlCodesFromLocalStorage());
            updateGalleryDisplay(loadGalleryImagesFromLocalStorage());

            document.getElementById('currentYear').textContent = new Date().getFullYear();
            showSection(activeSection, true); 
            console.log("App content initialized.");
        }
        
        // Zavolání inicializace po načtení DOM
        document.addEventListener('DOMContentLoaded', initializeAppContent);


        // --- Navigace ---
        function setupNavigation() {
            const navLinks = document.querySelectorAll('nav a.nav-link');
            navLinks.forEach(link => {
                link.addEventListener('click', (e) => {
                    e.preventDefault();
                    const sectionId = link.dataset.section;
                    showSection(sectionId);
                    navLinks.forEach(l => l.classList.remove('active'));
                    link.classList.add('active');
                });
            });
        }

        function showSection(id, isInitial = false) {
            activeSection = id;
            document.querySelectorAll('main section').forEach(section => {
                section.classList.remove('active'); // Pro CSS animaci
                section.style.display = 'none'; 
            });
            const sectionElement = document.getElementById(id);
            if (sectionElement) {
                sectionElement.style.display = 'block'; 
                // Timeout pro zajištění, že 'display: block' se projeví před přidáním třídy 'active' pro animaci
                setTimeout(() => sectionElement.classList.add('active'), isInitial ? 0 : 5); 
            }
        }

        // --- HTML Editor & LocalStorage ---
        const HTML_CODES_STORAGE_KEY = 'personalPage_htmlCodes';

        function setupHtmlEditor() {
            const editor = document.getElementById('html-editor');
            const preview = document.getElementById('html-preview');
            const saveBtn = document.getElementById('save-code-btn');
            
            editor.addEventListener('input', () => {
                preview.srcdoc = editor.value;
            });

            saveBtn.addEventListener('click', () => {
                if (!editor.value.trim()) {
                    showAlertModal("Prázdný kód", "Nelze uložit prázdný HTML kód.");
                    return;
                }
                showSaveCodeModal(); // Otevře modal pro zadání názvu
            });
            preview.srcdoc = ""; // Výchozí obsah náhledu
        }
        
        function saveHtmlCodeToLocalStorage(title, code) {
            const codes = loadHtmlCodesFromLocalStorage();
            const newCode = { 
                id: `code-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, // Jednoduché unikátní ID
                title, 
                code, 
                createdAt: new Date().toISOString() 
            };
            codes.unshift(newCode); // Přidání na začátek pole pro zobrazení nejnovějších nahoře
            try {
                localStorage.setItem(HTML_CODES_STORAGE_KEY, JSON.stringify(codes));
                renderSavedCodes(codes); // Aktualizace zobrazení
                showAlertModal("Kód uložen", `Kód "${title}" byl úspěšně uložen lokálně.`);
            } catch (e) {
                console.error("Error saving to localStorage:", e);
                showAlertModal("Chyba ukládání", "Nepodařilo se uložit kód. Možná je localStorage plný.");
            }
        }

        function loadHtmlCodesFromLocalStorage() {
            const codesJson = localStorage.getItem(HTML_CODES_STORAGE_KEY);
            return codesJson ? JSON.parse(codesJson) : [];
        }

        function deleteHtmlCodeFromLocalStorage(id) {
            let codes = loadHtmlCodesFromLocalStorage();
            codes = codes.filter(code => code.id !== id);
            try {
                localStorage.setItem(HTML_CODES_STORAGE_KEY, JSON.stringify(codes));
                renderSavedCodes(codes); // Aktualizace zobrazení
            } catch (e) {
                console.error("Error deleting from localStorage:", e);
                showAlertModal("Chyba mazání", "Nepodařilo se smazat kód.");
            }
        }

        function renderSavedCodes(codes) {
            const listEl = document.getElementById('saved-codes-list');
            listEl.innerHTML = ''; // Vyčistění seznamu
            if (codes.length === 0) {
                listEl.innerHTML = '<p>Žádné kódy zatím nebyly uloženy.</p>';
                return;
            }
            codes.forEach(item => {
                const div = document.createElement('div');
                div.className = 'saved-code-item';
                div.innerHTML = `
                    <div class="item-header">
                        <h3>${item.title}</h3>
                        <div class="actions">
                             <button data-action="load" class="button btn-secondary">Načíst</button>
                            <button data-action="delete" class="button btn-danger">Smazat</button>
                        </div>
                    </div>
                    <p>Uloženo: ${new Date(item.createdAt).toLocaleString('cs-CZ')}</p>
                `;
                // Event listener pro načtení kódu
                div.querySelector('button[data-action="load"]').addEventListener('click', (e) => {
                    e.stopPropagation(); // Zabrání propagaci na rodičovský div
                    document.getElementById('html-editor').value = item.code;
                    document.getElementById('html-preview').srcdoc = item.code;
                    showSection('editor'); 
                    document.querySelector('.nav-link[data-section="editor"]').click(); // Aktivace tabu editoru
                    showAlertModal("Kód načten", `Kód "${item.title}" byl načten do editoru.`);
                });
                // Event listener pro smazání kódu
                div.querySelector('button[data-action="delete"]').addEventListener('click', async (e) => {
                     e.stopPropagation(); // Zabrání propagaci
                    if (confirm(`Opravdu chcete smazat kód "${item.title}"?`)) {
                         deleteHtmlCodeFromLocalStorage(item.id);
                    }
                });
                // Kliknutí na celou položku také načte kód (bez smazání)
                div.addEventListener('click', () => {
                    document.getElementById('html-editor').value = item.code;
                    document.getElementById('html-preview').srcdoc = item.code;
                    showSection('editor');
                    document.querySelector('.nav-link[data-section="editor"]').click();
                });
                listEl.appendChild(div);
            });
        }
        
        // --- Galerie & LocalStorage ---
        const GALLERY_IMAGES_STORAGE_KEY = 'personalPage_galleryImages';

        function setupGallery() {
            document.getElementById('addImageUrlBtn').addEventListener('click', handleAddImageUrl);
            // Event listenery pro modal galerie
            document.getElementById('close-modal-btn').addEventListener('click', closeImageModal);
            document.getElementById('prev-image-btn').addEventListener('click', () => navigateImageModal(-1));
            document.getElementById('next-image-btn').addEventListener('click', () => navigateImageModal(1));
        }

        function handleAddImageUrl() {
            const urlInput = document.getElementById('newImageUrl');
            const imageUrl = urlInput.value.trim();
            if (imageUrl && isValidHttpUrl(imageUrl)) {
                saveGalleryImageToLocalStorage(imageUrl, ''); // Uložení s prázdným názvem
                urlInput.value = ''; // Vyčištění inputu
                showAlertModal("Obrázek přidán", "Obrázek byl úspěšně přidán do lokální galerie.");
            } else {
                showAlertModal("Neplatná URL", "Prosím, zadejte platnou URL adresu obrázku (začínající http:// nebo https://).");
            }
        }
        
        function isValidHttpUrl(string) {
            let url; 
            try { url = new URL(string); } 
            catch (_) { return false; }
            return url.protocol === "http:" || url.protocol === "https:";
        }

        function saveGalleryImageToLocalStorage(imageUrl, imageName = '') {
            const images = loadGalleryImagesFromLocalStorage();
            const newImage = {
                id: `img-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                url: imageUrl,
                name: imageName || `Obrázek ${images.length + 1}`,
                createdAt: new Date().toISOString()
            };
            images.unshift(newImage);
            try {
                localStorage.setItem(GALLERY_IMAGES_STORAGE_KEY, JSON.stringify(images));
                updateGalleryDisplay(images); // Aktualizace zobrazení
            } catch (e) {
                console.error("Error saving image to localStorage:", e);
                showAlertModal("Chyba ukládání obrázku", "Nepodařilo se uložit obrázek.");
            }
        }

        function loadGalleryImagesFromLocalStorage() {
            const imagesJson = localStorage.getItem(GALLERY_IMAGES_STORAGE_KEY);
            if (imagesJson) {
                return JSON.parse(imagesJson);
            }
            return [...initialImageUrls]; // Vrátí kopii výchozích, pokud nic není v localStorage
        }
        
        function deleteGalleryImageFromLocalStorage(id) {
            let images = loadGalleryImagesFromLocalStorage();
            images = images.filter(img => img.id !== id);
            try {
                localStorage.setItem(GALLERY_IMAGES_STORAGE_KEY, JSON.stringify(images));
                updateGalleryDisplay(images); // Aktualizace zobrazení
            } catch (e) {
                console.error("Error deleting image from localStorage:", e);
                showAlertModal("Chyba mazání obrázku", "Nepodařilo se smazat obrázek.");
            }
        }


        function updateGalleryDisplay(images) {
            galleryImagesData = images; // Aktualizace globálního pole pro modal
            const container = document.getElementById('gallery-container');
            container.innerHTML = ''; 

            if (galleryImagesData.length === 0) {
                 container.innerHTML = '<p>Galerie je prázdná. Přidejte obrázky pomocí URL výše.</p>';
                return;
            }

            galleryImagesData.forEach((imgData, index) => {
                const div = document.createElement('div');
                div.className = 'gallery-image-wrapper';
                div.innerHTML = `
                    <img src="${imgData.url}" alt="${imgData.name || 'Obrázek z galerie'}" onerror="this.onerror=null;this.src='https://placehold.co/300x300/f4f4f4/333333?text=Obrázek%0Anelze%0Anačíst';this.alt='Obrázek nelze načíst';">
                    <button data-img-id="${imgData.id}" class="delete-img-btn" title="Smazat obrázek">&times;</button>
                `;
                // Kliknutí na obrázek otevře modal
                div.querySelector('img').addEventListener('click', () => openImageModal(index));
                // Kliknutí na tlačítko smazání
                div.querySelector('.delete-img-btn').addEventListener('click', async (e) => {
                    e.stopPropagation(); // Zabrání otevření modalu
                    const imgId = e.currentTarget.dataset.imgId;
                    if (confirm(`Opravdu chcete smazat tento obrázek?`)) {
                        deleteGalleryImageFromLocalStorage(imgId);
                    }
                });
                container.appendChild(div);
            });
        }

        // --- Modal pro obrázky galerie ---
        function openImageModal(index) {
            if (index < 0 || index >= galleryImagesData.length) return;
            currentModalImageIndex = index;
            const modal = document.getElementById('image-modal');
            const modalImg = document.getElementById('modal-img');
            modalImg.src = galleryImagesData[index].url;
            modalImg.alt = galleryImagesData[index].name || 'Zvětšený obrázek';
            
            modal.classList.remove('hidden'); // Odstranění třídy hidden
            // Plynulé zobrazení
            setTimeout(() => {
                modal.classList.remove('opacity-0');
                modal.querySelector('.modal-content').classList.remove('scale-95', 'opacity-0');
                modal.querySelector('.modal-content').classList.add('scale-100', 'opacity-100');
            }, 10); // Malý timeout pro CSS transition
        }

        function closeImageModal() {
            const modal = document.getElementById('image-modal');
            modal.querySelector('.modal-content').classList.remove('scale-100', 'opacity-100');
            modal.querySelector('.modal-content').classList.add('scale-95', 'opacity-0');
            modal.classList.add('opacity-0');
            setTimeout(() => modal.classList.add('hidden'), 300); // Synchronizace s CSS transition
        }

        function navigateImageModal(direction) {
            const newIndex = currentModalImageIndex + direction;
            if (newIndex >= 0 && newIndex < galleryImagesData.length) {
                openImageModal(newIndex); // Znovu otevře modal s novým obrázkem
            }
        }
        
        // --- Vykreslení externích odkazů ---
        function renderExternalLinks() {
            const listEl = document.getElementById('links-list');
            listEl.innerHTML = ''; // Vyčistění seznamu
            externalLinksData.forEach(link => {
                const li = document.createElement('li');
                li.innerHTML = `<a href="${link.url}" target="_blank">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>
                                    ${link.title}
                                </a>`;
                listEl.appendChild(li);
            });
        }

        // --- Modální okna (Uložení kódu, Upozornění) ---
        const saveCodeModal = document.getElementById('save-code-modal');
        const codeTitleInput = document.getElementById('code-title-input');
        
        function showSaveCodeModal() {
            codeTitleInput.value = ''; 
            saveCodeModal.classList.remove('hidden');
            setTimeout(() => {
                saveCodeModal.classList.remove('opacity-0');
                saveCodeModal.querySelector('.modal-content').classList.remove('scale-95', 'opacity-0');
                saveCodeModal.querySelector('.modal-content').classList.add('scale-100', 'opacity-100');
                codeTitleInput.focus();
            }, 10);
        }
        function hideSaveCodeModal() {
            saveCodeModal.querySelector('.modal-content').classList.remove('scale-100', 'opacity-100');
            saveCodeModal.querySelector('.modal-content').classList.add('scale-95', 'opacity-0');
            saveCodeModal.classList.add('opacity-0');
            setTimeout(() => saveCodeModal.classList.add('hidden'), 300);
        }
        // Event listener pro potvrzení uložení kódu
        document.getElementById('confirm-save-code-btn').addEventListener('click', async () => {
            const title = codeTitleInput.value.trim();
            const code = document.getElementById('html-editor').value; // Kód z editoru
            if (title && code) {
                saveHtmlCodeToLocalStorage(title, code); // Uložení do localStorage
                hideSaveCodeModal();
            } else {
                showAlertModal("Chybějící údaje", "Prosím, zadejte název a ujistěte se, že kód není prázdný.");
            }
        });
        document.getElementById('cancel-save-code-btn').addEventListener('click', hideSaveCodeModal);

        // Alert Modal
        const alertModal = document.getElementById('alert-modal');
        const alertModalTitle = document.getElementById('alert-modal-title');
        const alertModalMessage = document.getElementById('alert-modal-message');
        
        window.showAlertModal = (title, message) => { // Přidání na window pro globální dostupnost
            return new Promise((resolve) => {
                alertModalTitle.textContent = title;
                alertModalMessage.textContent = message;
                alertModal.classList.remove('hidden');
                
                const okBtn = document.getElementById('alert-modal-ok-btn');
                // Klonování tlačítka pro odstranění starých event listenerů
                const newOkBtn = okBtn.cloneNode(true);
                okBtn.parentNode.replaceChild(newOkBtn, okBtn);

                newOkBtn.onclick = () => { // Přidání nového listeneru
                    hideAlertModal();
                    resolve(); // Resolve promisu po kliknutí na OK
                };
                // Plynulé zobrazení
                setTimeout(() => {
                    alertModal.classList.remove('opacity-0');
                    alertModal.querySelector('.modal-content').classList.remove('scale-95', 'opacity-0');
                    alertModal.querySelector('.modal-content').classList.add('scale-100', 'opacity-100');
                }, 10);
            });
        }
        function hideAlertModal() {
            alertModal.querySelector('.modal-content').classList.remove('scale-100', 'opacity-100');
            alertModal.querySelector('.modal-content').classList.add('scale-95', 'opacity-0');
            alertModal.classList.add('opacity-0');
            setTimeout(() => alertModal.classList.add('hidden'), 300);
        }
        
        // Globální zpřístupnění funkce pro přepínání sekcí, pokud by byla potřeba
        window.showSection = showSection;