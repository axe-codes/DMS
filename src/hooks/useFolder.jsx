import { useReducer, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { database, firestore } from "../firebase";
import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  where,
} from "firebase/firestore";

const ACTIONS = {
  SELECT_FOLDER: "select-folder",
  UPDATE_FOLDER: "update-folder",
  SET_CHILD_FOLDERS: "set-child-folders",
  SET_CHILD_FILES: "set-child-files",
};

export const ROOT_FOLDER = { name: "Root", id: null, path: [] };

function reducer(state, { type, payload }) {
  switch (type) {
    case ACTIONS.SELECT_FOLDER:
      return {
        folderId: payload.folderId,
        folder: payload.folder,
        childFiles: [],
        childFolders: [],
      };
    case ACTIONS.UPDATE_FOLDER:
      return {
        ...state,
        folder: payload.folder,
      };
    case ACTIONS.SET_CHILD_FOLDERS:
      return {
        ...state,
        childFolders: payload.childFolders,
      };
    case ACTIONS.SET_CHILD_FILES:
      return {
        ...state,
        childFiles: payload.childFiles,
      };
    default:
      return state;
  }
}

export function useFolder(folderId = null, folder = null) {
  const [state, dispatch] = useReducer(reducer, {
    folderId,
    folder,
    childFolders: [],
    childFiles: [],
  });

  const { currentUser } = useAuth();

  useEffect(() => {
    dispatch({ type: ACTIONS.SELECT_FOLDER, payload: { folderId, folder } });
  }, [folderId, folder]);

  useEffect(() => {
    if (folderId === null) {
      return dispatch({
        type: ACTIONS.UPDATE_FOLDER,
        payload: { folder: ROOT_FOLDER },
      });
    }

    const folderRef = doc(database.folders, folderId);

    const getFolder = async () => {
      try {
        const docSnap = await getDoc(folderRef);
        dispatch({
          type: ACTIONS.UPDATE_FOLDER,
          payload: {
            folder: docSnap.exists()
              ? { id: docSnap.id, ...docSnap.data() }
              : ROOT_FOLDER,
          },
        });
      } catch {
        dispatch({
          type: ACTIONS.UPDATE_FOLDER,
          payload: { folder: ROOT_FOLDER },
        });
      }
    };

    getFolder();

    // Cleanup function
    return () => {};
  }, [folderId]);

  useEffect(() => {
    if (folderId == null || !currentUser) return;

    const q = query(
      collection(firestore, "folders"),
      where("parentId", "==", folderId),
      where("userId", "==", currentUser.uid),
      orderBy("createdAt")
    );

    const unsubscribeFolders = onSnapshot(q, (snapshot) => {
      dispatch({
        type: ACTIONS.SET_CHILD_FOLDERS,
        payload: {
          childFolders: snapshot.docs.map(database.formatDoc),
        },
      });
    });

    // Cleanup function
    return () => unsubscribeFolders();
  }, [folderId, currentUser]);

  useEffect(() => {
    if (folderId == null || !currentUser) return;
    // console.log("Folder ID - ", folderId);
    // console.log("user ID - ", currentUser.uid);

    const filesQuery = query(
      collection(firestore, "files"),
      where("folderId", "==", folderId),
      where("userId", "==", currentUser.uid)
      // orderBy("createdAt") // Uncommented for consistency
    );

    const unsubscribeFiles = onSnapshot(filesQuery, (snapshot) => {
      dispatch({
        type: ACTIONS.SET_CHILD_FILES,
        payload: {
          childFiles: snapshot.docs.map(database.formatDoc),
        },
      });
    });

    // Cleanup function
    return () => unsubscribeFiles();
  }, [folderId, currentUser]);

  return state;
}

// useEffect(() => {
//   if (folderId == null) return;

//   const unsubscribeFiles = database.files
//     .where("folderId", "==", folderId)
//     .where("userId", "==", currentUser.uid)
//     //.orderBy("createdAt") // Uncommented for consistency
//     .onSnapshot((snapshot) => {
//       dispatch({
//         type: ACTIONS.SET_CHILD_FILES,
//         payload: { childFiles: snapshot.docs.map(database.formatDoc) },
//       });
//     });

//   // Cleanup function
//   return () => unsubscribeFiles();
// }, [folderId, currentUser]);
