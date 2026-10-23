# Publicar CertLab en Netlify

## 1. Probar antes de subir

En PowerShell, dentro de esta carpeta:

```powershell
npm install
npm run dev
```

Abra `http://localhost:5173`.

Compruebe también la compilación que utilizará Netlify:

```powershell
npm run build
npm run preview
```

## 2. Crear el repositorio en GitHub

1. Abra <https://github.com/new>.
2. Cree un repositorio, por ejemplo `certlab-microsoft`.
3. Para mantener privado el banco, seleccione **Private**.
4. No agregue README ni `.gitignore` desde GitHub; el proyecto ya los incluye.

En PowerShell, dentro de la carpeta:

```powershell
git init
git add .
git commit -m "Publicar simulador CertLab"
git branch -M main
git remote add origin https://github.com/TU-USUARIO/certlab-microsoft.git
git push -u origin main
```

Sustituya `TU-USUARIO` por su usuario de GitHub.

## 3. Conectar Netlify

1. Inicie sesión en <https://app.netlify.com>.
2. Seleccione **Add new project** y después **Import an existing project**.
3. Elija **GitHub** y autorice únicamente el repositorio necesario.
4. Seleccione `certlab-microsoft`.
5. Netlify leerá automáticamente `netlify.toml`.
6. Confirme:

| Campo | Valor |
| --- | --- |
| Production branch | `main` |
| Build command | `npm run build` |
| Publish directory | `dist` |
| Base directory | vacío / raíz del repositorio |

7. Presione **Deploy**.

Netlify entregará una dirección parecida a:

```text
https://certlab-microsoft.netlify.app
```

## 4. Publicar futuras actualizaciones

Después de modificar el proyecto:

```powershell
git add .
git commit -m "Actualizar simulador"
git push
```

Netlify reconstruirá y publicará automáticamente el sitio.

## Consideraciones de privacidad

- El historial y los favoritos se guardan en LocalStorage del navegador.
- El progreso no se sincroniza entre equipos o navegadores.
- El archivo `/data/questions.json` se descarga en el navegador y puede ser
  consultado por quien tenga acceso al sitio.
- Un repositorio privado evita exponer el código en GitHub, pero no convierte
  una URL pública de Netlify en un sitio privado.
