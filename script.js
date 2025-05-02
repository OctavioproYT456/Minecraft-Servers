document.addEventListener('DOMContentLoaded', () => {
    const loadingElement = document.getElementById('loading');
    const errorElement = document.getElementById('error');
    const servidoresContainer = document.getElementById('servidores-container');
    const noResultsElement = document.getElementById('no-results');
    const filterButtons = document.querySelectorAll('.filter-btn');
    
    let currentFilter = 'all';
    let servidoresData = [];

    // Función para formatear la descripción con códigos de color de Minecraft
    function formatDescription(description) {
        // Códigos de color de Minecraft a CSS
        const colorCodes = {
            '§0': '<span style="color: #000000;">',
            '§1': '<span style="color: #0000AA;">',
            '§2': '<span style="color: #00AA00;">',
            '§3': '<span style="color: #00AAAA;">',
            '§4': '<span style="color: #AA0000;">',
            '§5': '<span style="color: #AA00AA;">',
            '§6': '<span style="color: #FFAA00;">',
            '§7': '<span style="color: #AAAAAA;">',
            '§8': '<span style="color: #555555;">',
            '§9': '<span style="color: #5555FF;">',
            '§a': '<span style="color: #55FF55;">',
            '§b': '<span style="color: #55FFFF;">',
            '§c': '<span style="color: #FF5555;">',
            '§d': '<span style="color: #FF55FF;">',
            '§e': '<span style="color: #FFFF55;">',
            '§f': '<span style="color: #FFFFFF;">',
            '§l': '<span style="font-weight: bold;">',
            '§m': '<span style="text-decoration: line-through;">',
            '§n': '<span style="text-decoration: underline;">',
            '§o': '<span style="font-style: italic;">',
            '§r': '</span>'
        };

        let formattedText = description;
        // Reemplazar todos los códigos de color
        for (const [code, htmlTag] of Object.entries(colorCodes)) {
            formattedText = formattedText.split(code).join(htmlTag);
        }

        // Cerrar todos los spans abiertos
        const openTags = (formattedText.match(/<span/g) || []).length;
        const closeTags = (formattedText.match(/<\/span>/g) || []).length;
        if (openTags > closeTags) {
            formattedText += '</span>'.repeat(openTags - closeTags);
        }

        return formattedText;
    }

    // Función para verificar el estado del servidor
    async function checkServerStatus(ip, port, platform = 'java') {
        try {
            // Usar la API de mcstatus para obtener el estado del servidor
            const response = await fetch(`https://api.mcstatus.io/v2/status/${platform}/${ip}${port ? `:${port}` : ''}`);
            if (!response.ok) {
                throw new Error('Error al consultar el estado del servidor');
            }
            return await response.json();
        } catch (error) {
            console.error('Error al verificar el estado del servidor:', error);
            return { online: false, error: error.message };
        }
    }

    // Actualizar la función createServerElement para incluir datos de plataforma
    function createServerElement(servidor, statusData) {
        const servidorElement = document.createElement('div');
        servidorElement.className = 'servidor';
        
        // Agregar atributo de datos para el filtrado
        let platformAttribute = 'all';
        if (servidor.version.mc === 'java') {
            platformAttribute = 'java';
        } else if (servidor.version.mc === 'bedrock') {
            platformAttribute = 'bedrock';
        }
        servidorElement.setAttribute('data-platform', platformAttribute);

        // Determinar tipo de versión para mostrar y guardar para el botón de añadir
        let versionType = '';
        let serverType = servidor.version.mc;
        if (servidor.version.mc === 'all') {
            versionType = 'Bedrock y Java';
            serverType = 'dual';
        } else {
            versionType = servidor.version.mc.charAt(0).toUpperCase() + servidor.version.mc.slice(1);
        }

        // Verificar si el servidor es multiversión
        const multiVersion = servidor.version.multi === 'yes' ? 'Sí' : 'No';

        // Crear el contenido HTML del servidor
        let statusHTML = '';
        if (statusData.error) {
            statusHTML = `
                <div class="servidor-status status-offline">
                    <div class="status-indicator indicator-offline"></div>
                    <div class="status-text">Offline o no disponible</div>
                </div>
            `;
        } else if (statusData.online) {
            statusHTML = `
                <div class="servidor-status status-online">
                    <div class="status-indicator indicator-online"></div>
                    <div class="status-text">Online: <span class="player-count">${statusData.players.online}/${statusData.players.max} jugadores</span></div>
                </div>
            `;
        } else {
            statusHTML = `
                <div class="servidor-status status-offline">
                    <div class="status-indicator indicator-offline"></div>
                    <div class="status-text">Offline</div>
                </div>
            `;
        }

        servidorElement.innerHTML = `
            <div class="servidor-header">
                <img src="${servidor.icon}" alt="${servidor.name}" class="servidor-icon">
                <h2 class="servidor-name">${servidor.name}</h2>
            </div>
            <div class="servidor-body">
                <div class="servidor-description">${formatDescription(servidor.descripción)}</div>
                <div class="servidor-info">
                    <div class="info-item">
                        <span class="info-label">Versión</span>
                        <span class="info-value">${servidor.version.server}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Tipo</span>
                        <span class="info-value">${versionType}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Multiversión</span>
                        <span class="info-value">${multiVersion}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">IP</span>
                        <span class="info-value">${servidor.ip}${servidor.port ? `:${servidor.port}` : ''}</span>
                    </div>
                </div>
                ${statusHTML}
                <div class="button-container">
                    <button class="copy-btn" data-ip="${servidor.ip}${servidor.port ? `:${servidor.port}` : ''}">Copiar IP</button>
                    <button class="add-to-mc-btn" data-ip="${servidor.ip}" data-port="${servidor.port || ''}" data-name="${servidor.name}" data-type="${serverType}">Añadir a Minecraft</button>
                </div>
            </div>
        `;

        // Agregar evento para copiar la IP al portapapeles
        const copyBtn = servidorElement.querySelector('.copy-btn');
        copyBtn.addEventListener('click', () => {
            const ip = copyBtn.getAttribute('data-ip');
            navigator.clipboard.writeText(ip)
                .then(() => {
                    const originalText = copyBtn.textContent;
                    copyBtn.textContent = '¡IP Copiada!';
                    setTimeout(() => {
                        copyBtn.textContent = originalText;
                    }, 2000);
                })
                .catch(err => {
                    console.error('Error al copiar IP:', err);
                    alert('No se pudo copiar la IP. Por favor, cópiala manualmente: ' + ip);
                });
        });

        // Agregar evento para añadir el servidor a Minecraft
        const addToMcBtn = servidorElement.querySelector('.add-to-mc-btn');
        addToMcBtn.addEventListener('click', () => {
            const ip = addToMcBtn.getAttribute('data-ip');
            const port = addToMcBtn.getAttribute('data-port');
            const name = addToMcBtn.getAttribute('data-name');
            const type = addToMcBtn.getAttribute('data-type');
            
            addServerToMinecraft(name, ip, port, type);
        });

        return servidorElement;
    }

    // Función para añadir servidor a Minecraft
    function addServerToMinecraft(serverName, serverIp, serverPort, serverType) {
        const fullAddress = serverPort ? `${serverIp}:${serverPort}` : serverIp;
        let urlScheme = '';
        
        if (serverType === 'bedrock' || serverType === 'dual') {
            // Bedrock protocol
            urlScheme = `minecraft://?addExternalServer=${encodeURIComponent(serverName)}|${encodeURIComponent(fullAddress)}`;
            
            // Abrir en dispositivo móvil o alertar en PC para Bedrock
            if (/Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) {
                window.location.href = urlScheme;
            } else {
                alert(`Para añadir este servidor a Minecraft Bedrock:\n\n1. Abre Minecraft Bedrock Edition\n2. Ve a Jugar → Servidores → Añadir Servidor\n3. Nombre: ${serverName}\n4. Dirección del servidor: ${fullAddress}`);
            }
        }
        
        if (serverType === 'java' || serverType === 'dual') {
            // Para Java, mostrar instrucciones
            const javaInstructions = `Para añadir este servidor a Minecraft Java:\n\n1. Abre Minecraft Java Edition\n2. Haz clic en "Multijugador"\n3. Haz clic en "Añadir servidor"\n4. Nombre del servidor: ${serverName}\n5. Dirección del servidor: ${fullAddress}\n6. Haz clic en "Listo"`;
            
            if (serverType === 'dual' && /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) {
                // Si es dual y estamos en móvil, mostrar instrucciones de Java después de intentar abrir Bedrock
                setTimeout(() => {
                    alert(javaInstructions);
                }, 1000);
            } else if (serverType === 'java') {
                alert(javaInstructions);
            }
        }
        
        // Si es PC y es dual, mostrar ambas instrucciones
        if (serverType === 'dual' && !/Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) {
            alert(`Para añadir este servidor a Minecraft Bedrock:\n\n1. Abre Minecraft Bedrock Edition\n2. Ve a Jugar → Servidores → Añadir Servidor\n3. Nombre: ${serverName}\n4. Dirección del servidor: ${fullAddress}\n\n----- O -----\n\nPara añadir este servidor a Minecraft Java:\n\n1. Abre Minecraft Java Edition\n2. Haz clic en "Multijugador"\n3. Haz clic en "Añadir servidor"\n4. Nombre del servidor: ${serverName}\n5. Dirección del servidor: ${fullAddress}\n6. Haz clic en "Listo"`);
        }
    }

    // Función para aplicar filtros
    function applyFilter(filter) {
        const allServers = document.querySelectorAll('.servidor');
        let visibleCount = 0;
        
        allServers.forEach(server => {
            const serverPlatform = server.getAttribute('data-platform');
            
            if (filter === 'all' || serverPlatform === filter || serverPlatform === 'all') {
                server.style.display = '';
                visibleCount++;
            } else {
                server.style.display = 'none';
            }
        });
        
        // Mostrar mensaje si no hay resultados
        if (visibleCount === 0 && servidoresData.length > 0) {
            noResultsElement.classList.remove('hidden');
        } else {
            noResultsElement.classList.add('hidden');
        }
    }

    // Configurar eventos de filtrado
    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Actualizar la clase active
            filterButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            
            // Aplicar el filtro
            currentFilter = button.getAttribute('data-filter');
            applyFilter(currentFilter);
        });
    });

    // Función principal para cargar los servidores
    async function loadServers() {
        try {
            // Cargar los datos de los servidores desde el JSON
            const response = await fetch('https://octavioproyt456.github.io/data/MC/servidores.json');
            if (!response.ok) {
                throw new Error('Error al cargar los datos de los servidores');
            }
            servidoresData = await response.json();

            // Ocultar el indicador de carga
            loadingElement.classList.add('hidden');

            // Verificar cada servidor
            for (const servidor of servidoresData) {
                // Determinar la plataforma para la consulta a la API
                const platform = servidor.version.mc === 'all' ? 'java' : servidor.version.mc;
                
                // Verificar el estado del servidor
                const statusData = await checkServerStatus(servidor.ip, servidor.port, platform);
                
                // Crear y agregar el elemento del servidor
                const servidorElement = createServerElement(servidor, statusData);
                servidoresContainer.appendChild(servidorElement);
                
                // Configurar actualización periódica cada 5 segundos
                setInterval(async () => {
                    const updatedStatusData = await checkServerStatus(servidor.ip, servidor.port, platform);
                    updateServerStatus(servidorElement, updatedStatusData);
                }, 5000);
            }

            // Mostrar el contenedor de servidores
            servidoresContainer.classList.remove('hidden');
            
            // Aplicar el filtro inicial
            applyFilter(currentFilter);
        } catch (error) {
            console.error('Error al cargar los servidores:', error);
            loadingElement.classList.add('hidden');
            errorElement.textContent = `Error: ${error.message}`;
            errorElement.classList.remove('hidden');
        }
    }

    // Función para actualizar el estado del servidor
    function updateServerStatus(serverElement, statusData) {
        const statusContainer = serverElement.querySelector('.servidor-status');
        
        let statusHTML = '';
        if (statusData.error) {
            statusHTML = `
                <div class="status-indicator indicator-offline"></div>
                <div class="status-text">Offline o no disponible</div>
            `;
            statusContainer.className = 'servidor-status status-offline';
        } else if (statusData.online) {
            statusHTML = `
                <div class="status-indicator indicator-online"></div>
                <div class="status-text">Online: <span class="player-count">${statusData.players.online}/${statusData.players.max} jugadores</span></div>
            `;
            statusContainer.className = 'servidor-status status-online';
        } else {
            statusHTML = `
                <div class="status-indicator indicator-offline"></div>
                <div class="status-text">Offline</div>
            `;
            statusContainer.className = 'servidor-status status-offline';
        }
        
        statusContainer.innerHTML = statusHTML;
    }
    
    // Iniciar la carga de servidores
    loadServers();
});
