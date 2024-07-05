import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom";
import { faFileUpload } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useAuth } from "../../contexts/AuthContext";
import { storage, database } from "../../firebase";
import { ROOT_FOLDER } from "../../hooks/useFolder";
import { v4 as uuidV4 } from "uuid";
import { ProgressBar, Toast } from "react-bootstrap";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import {
  addDoc,
  query,
  where,
  getDocs,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";

export default function AddFileButton({ currentFolder }) {
  const [uploadingFiles, setUploadingFiles] = useState([]);
  const { currentUser } = useAuth();

  function handleUpload(e) {
    const file = e.target.files[0];
    if (currentFolder == null || file == null) return;

    const id = uuidV4();
    setUploadingFiles((prevUploadingFiles) => [
      ...prevUploadingFiles,
      { id, name: file.name, progress: 0, error: false },
    ]);

    const filePath =
      currentFolder === ROOT_FOLDER
        ? `files/${currentUser.uid}/${file.name}`
        : `files/${currentUser.uid}/${currentFolder.path
            .map((folder) => folder.name)
            .join("/")}/${currentFolder.name}/${file.name}`;

    const fileRef = ref(storage, filePath);
    const uploadTask = uploadBytesResumable(fileRef, file);

    uploadTask.on(
      "state_changed",
      (snapshot) => {
        const progress =
          (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        setUploadingFiles((prevUploadingFiles) =>
          prevUploadingFiles.map((uploadFile) =>
            uploadFile.id === id ? { ...uploadFile, progress } : uploadFile
          )
        );
      },
      (error) => {
        setUploadingFiles((prevUploadingFiles) =>
          prevUploadingFiles.map((uploadFile) =>
            uploadFile.id === id ? { ...uploadFile, error: true } : uploadFile
          )
        );
      },
      async () => {
        try {
          const url = await getDownloadURL(uploadTask.snapshot.ref);

          // console.log("URL is  - ", url);

          try {
            await addDoc(database.files, {
              url,
              name: file.name,
              createdAt: serverTimestamp(),
              folderId: currentFolder.id,
              userId: currentUser.uid,
            });
          } catch (error) {
            console.error("Error adding file document: ", error);
          }

          // const q = query(
          //   collection(database, "files"),
          //   where("name", "==", file.name),
          //   where("userId", "==", currentUser.uid),
          //   where("folderId", "==", currentFolder.id)
          // );

          // const querySnapshot = await getDocs(q);

          // console.log("querySnapshot is -", querySnapshot);

          // const existingFile = querySnapshot.docs[0];

          // console.log("existingFile is -", existingFile);

          // if (existingFile) {
          //   await updateDoc(existingFile.ref, { url });
          // } else {
          //   await addDoc(database.files, {
          //     url,
          //     name: file.name,
          //     createdAt: serverTimestamp(),
          //     folderId: currentFolder.id,
          //     userId: currentUser.uid,
          //   });
          // }
        } catch (error) {
          setUploadingFiles((prevUploadingFiles) =>
            prevUploadingFiles.map((uploadFile) =>
              uploadFile.id === id ? { ...uploadFile, error: true } : uploadFile
            )
          );
        }

        setUploadingFiles((prevUploadingFiles) =>
          prevUploadingFiles.filter((uploadFile) => uploadFile.id !== id)
        );
      }
    );
  }

  return (
    <>
      <label className="btn btn-outline-success btn-sm m-0 mr-2">
        <FontAwesomeIcon icon={faFileUpload} />
        <input
          type="file"
          onChange={handleUpload}
          style={{ opacity: 0, position: "absolute", left: "-9999px" }}
        />
      </label>
      {uploadingFiles.length > 0 &&
        ReactDOM.createPortal(
          <div
            style={{
              position: "absolute",
              bottom: "1rem",
              right: "1rem",
              maxWidth: "250px",
            }}
          >
            {uploadingFiles.map((file) => (
              <Toast
                key={file.id}
                onClose={() => {
                  setUploadingFiles((prevUploadingFiles) =>
                    prevUploadingFiles.filter(
                      (uploadFile) => uploadFile.id !== file.id
                    )
                  );
                }}
              >
                <Toast.Header
                  closeButton={file.error}
                  className="text-truncate w-100 d-block"
                >
                  {file.name}
                </Toast.Header>
                <Toast.Body>
                  <ProgressBar
                    animated={!file.error}
                    variant={file.error ? "danger" : "primary"}
                    now={file.error ? 100 : file.progress}
                    label={
                      file.error ? "Error" : `${Math.round(file.progress)}%`
                    }
                  />
                </Toast.Body>
              </Toast>
            ))}
          </div>,
          document.body
        )}
    </>
  );
}
