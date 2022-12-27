const { initializeApp } = require("firebase/app");
const {
  getFirestore,
  addDoc,
  collection,
  getDocs,
  setDoc,
  doc,
  getDoc,
} = require("firebase/firestore");

const {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} = require("firebase/auth");

const users = require("./public/json/users.json");

const firebaseConfig = {
  apiKey: "AIzaSyBTWK9PrB0NqrvujY4xQID3c72SdNpLDsw",
  authDomain: "stickman-78f30.firebaseapp.com",
  projectId: "stickman-78f30",
  storageBucket: "stickman-78f30.appspot.com",
  messagingSenderId: "988800194409",
  appId: "1:988800194409:web:bdba98324b76559d6bcff8",
  measurementId: "G-PPTQ4L7GQ7",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const insert = async (collec, data) => {
  try {
    const docRef = await addDoc(collection(db, collec), data);
    console.log("Document written with ID: ", docRef.id);
  } catch (e) {
    console.error("Error adding document: ", e);
  }
};

const getData = async (collec, q = "") => {
  const col = collection(db, collec);

  if (q != "") {
    querySnapshot = await getDocs(q);
  } else {
    querySnapshot = await getDocs(col);
  }

  res = new Array();
  querySnapshot.forEach((doc) => {
    res.push(doc.data());
  });

  return res;
};

const createUser = (email, pass) => {
  const auth = getAuth();
  createUserWithEmailAndPassword(auth, email, pass)
    .then((userCredential) => {
      console.log("signed");
    })
    .catch((error) => {
      console.log("not signed");
    });
};

const signInUser = (email, pass) => {
  const auth = getAuth();
  return signInWithEmailAndPassword(auth, email, pass);
};

const getAllData = async (startdate = "", enddate = "") => {
  let allEntries = [];

  for (let index = 0; index < users.length; index++) {
    const coll = users[index].username;

    const entries = await getData(coll);
    entries.forEach((entry) => {
      let helper = new Array();
      if (entry["count"]) return;
      helper.push(entry["id"]);
      helper.push(entry["name"]);
      helper.push(entry["number"]);
      helper.push(entry["date_added"].toDate());

      if (
        !startdate ||
        (helper[3] - startdate >= 0 && helper[3] - enddate <= 0)
      ) {
        allEntries.push(helper);
      }
    });
  }

  allEntries.sort((a, b) => {
    return a[3] - b[3];
  });

  return allEntries;
};

const getAllUserData = async (username, startDate = "", endDate = "") => {
  let allEntries = new Array();
  const entries = await getData(username);

  entries.forEach((mp) => {
    let helper = new Array();
    if (mp["count"]) return;
    helper.push(mp["id"]);
    helper.push(mp["name"]);
    helper.push(mp["number"]);
    helper.push(mp["date_added"].toDate());
    if (!startDate || (helper[3] >= startDate && helper[3] <= endDate))
      allEntries.push(helper);
  });

  allEntries.sort((a, b) => {
    return a[0] - b[0];
  });

  return allEntries;
};

const getCount = async (username, docId) => {
  const docRef = doc(db, username, docId);
  const docSnap = await getDoc(docRef);
  return docSnap.data()["count"];
};

function updateConter(username, docId, count) {
  const docRef = doc(db, username, docId);
  const data = {
    count: count,
  };
  setDoc(docRef, data)
    .then((docRef) => {
      console.log("--------------- Counter Updated -----------");
    })
    .catch((error) => {
      console.log("---------------- Unable to Update Counter --------------");
    });
}

module.exports = {
  insert,
  getData,
  createUser,
  signInUser,
  getAllData,
  getCount,
  updateConter,
  getAllUserData,
};
