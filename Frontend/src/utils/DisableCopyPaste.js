import { useEffect } from 'react';

const DisableCopyPaste = () => {
  useEffect(() => {
    // Désactiver le menu contextuel (clic droit)
    const disableContextMenu = (e) => {
      e.preventDefault();
      return false;
    };

    // Désactiver le copier (Ctrl+C, Cmd+C)
    const disableCopy = (e) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.keyCode === 67 || e.keyCode === 86 || e.keyCode === 88) {
          e.preventDefault();
          return false;
        }
      }
      // Bloquer aussi le clic droit + copier
      if (e.type === 'copy') {
        e.preventDefault();
        return false;
      }
    };

    // Désactiver le couper (Ctrl+X, Cmd+X)
    const disableCut = (e) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.keyCode === 88) {
          e.preventDefault();
          return false;
        }
      }
      if (e.type === 'cut') {
        e.preventDefault();
        return false;
      }
    };

    // Désactiver le coller (Ctrl+V, Cmd+V)
    const disablePaste = (e) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.keyCode === 86) {
          e.preventDefault();
          return false;
        }
      }
      if (e.type === 'paste') {
        e.preventDefault();
        return false;
      }
    };

    // Désactiver la sélection de texte
    const disableSelect = (e) => {
      e.preventDefault();
      return false;
    };

    // Désactiver le drag and drop
    const disableDragDrop = (e) => {
      e.preventDefault();
      return false;
    };

    // Ajouter les écouteurs d'événements
    document.addEventListener('contextmenu', disableContextMenu);
    document.addEventListener('copy', disableCopy);
    document.addEventListener('cut', disableCut);
    document.addEventListener('paste', disablePaste);
    document.addEventListener('selectstart', disableSelect);
    document.addEventListener('dragstart', disableDragDrop);
    document.addEventListener('drop', disableDragDrop);
    document.addEventListener('keydown', disableCopy);
    document.addEventListener('keydown', disableCut);
    document.addEventListener('keydown', disablePaste);

    // Nettoyer les écouteurs lors du démontage du composant
    return () => {
      document.removeEventListener('contextmenu', disableContextMenu);
      document.removeEventListener('copy', disableCopy);
      document.removeEventListener('cut', disableCut);
      document.removeEventListener('paste', disablePaste);
      document.removeEventListener('selectstart', disableSelect);
      document.removeEventListener('dragstart', disableDragDrop);
      document.removeEventListener('drop', disableDragDrop);
      document.removeEventListener('keydown', disableCopy);
      document.removeEventListener('keydown', disableCut);
      document.removeEventListener('keydown', disablePaste);
    };
  }, []);

  return null;
};

export default DisableCopyPaste;