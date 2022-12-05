const nodemailer = require('nodemailer');
const DEBUG = true;
const SOURCE_MAIL = 'babbo.natale.fontanelle@gmail.com';
const SOURCE_PSW = 'rsxdtspyasvuasga';
const fs = require('fs');
let transporter;
let people = [
	{
		isExtracted: { advicer: false, kid: false },
		id: 0,
		name: 'Matteo Citterio',
		mail: 'teocitte7@gmail.com',
		exceptions: [1],
	},
	{
		isExtracted: { advicer: false, kid: false },
		id: 1,
		name: 'Anna Zilioli',
		mail: 'anna.zilia.az@gmail.com',
		exceptions: [0],
	},
	{
		isExtracted: { advicer: false, kid: false },
		id: 2,
		name: 'Andrea Monguzzi',
		mail: 'andreamonguzzi4@gmail.com',
		exceptions: [7],
	},
	{
		isExtracted: { advicer: false, kid: false },
		id: 3,
		name: 'Davide Delmiglio',
		mail: 'davide200.dd@gmail.com',
		exceptions: [],
	},
	{
		isExtracted: { advicer: false, kid: false },
		id: 4,
		name: 'Alex Licata',
		mail: 'alerandom99@gmail.com',
		exceptions: [],
	},
	{
		isExtracted: { advicer: false, kid: false },
		id: 5,
		name: 'Greta Sieli',
		mail: 'gretasieli@libero.it',
		exceptions: [],
	},
	{
		isExtracted: { advicer: false, kid: false },
		id: 6,
		name: 'Gaia Consonni',
		mail: 'gaiaconsonni02@gmail.com',
		exceptions: [],
	},
	{
		isExtracted: { advicer: false, kid: false },
		id: 7,
		name: 'Angelica parricelli',
		mail: 'Angelicaparricelli@gmail.com',
		exceptions: [2],
	},
];

const loginToGmail = () => {
	transporter = nodemailer.createTransport({
		service: 'gmail',
		auth: {
			user: SOURCE_MAIL, // generated gmail user
			pass: SOURCE_PSW, // generated gmail account password
		},
	});
};

const sendMail = (from, to, subject, text, html, callBack) => {
	const mailOptions = {
		from,
		to,
		subject,
		text,
		html,
	};

	transporter.sendMail(mailOptions, callBack);
};

function arrayHasDuplicates(arr) {
	return arr.some(function (value) {
		if (arr.indexOf(value) !== arr.lastIndexOf(value)) {
			return true;
		}
		return false;
	});
}

const extractWithConditions = (
	avaliableValuesArray,
	conditionCallback,
	lastExtractionCallback
) => {
	if (!avaliableValuesArray || avaliableValuesArray.length === 0) {
		return null;
	}
	let count = 0;
	let extracted = null;
	do {
		extracted = Math.floor(Math.random() * avaliableValuesArray.length);
		count++;
	} while (conditionCallback(extracted) && count < 1000);

	if (extracted === null) {
		console.log('avaliableValuesArray: ' + avaliableValuesArray);
		console.log('extracted: ' + extracted);
		console.log('conditionCallback: ' + conditionCallback(extracted));
	}

	if (extracted !== null && extracted !== undefined) {
		return avaliableValuesArray[extracted].id;
	} else {
		return lastExtractionCallback();
	}
};

const getLastAvaliableKid = () => people.filter(({ isExtracted }) => !isExtracted.kid)[0].id;
const getLastAvaliableAdvicer = () => {
	return people.filter(({ isExtracted }) => !isExtracted.advicer)[0].id;
};

let result;
let errors = {
	isExceptionThrown: null,
	containsDuplicates: null,
	advicerIsKid: null,
	somethingNull: null,
	isSomeonNotExtracted: null,
	isSomethingMissing: null,
};
do {
	console.log('Extracting...');
	//resetting values
	result = [];
	Object.keys(errors).forEach((key) => (errors[key] = false));
	people = people.map(({ ...person }) => ({
		...person,
		isExtracted: { kid: false, advicer: false },
	}));
	for (let i = people.length - 1; i >= 0; i--) {
		let advicerId = null;
		let kidId = null;
		//extract kid
		kidId = extractWithConditions(
			people.filter(({ isExtracted, id }) => !isExtracted.kid && id !== people[i].id),

			(extracted) => people[i].exceptions.indexOf(extracted) !== -1,
			getLastAvaliableKid
		);
		if (kidId === null) {
			errors.somethingNull = true;
			break;
		}
		people[kidId].isExtracted.kid = true;

		//extract advicer
		advicerId = extractWithConditions(
			people.filter(
				({ isExtracted, id }) =>
					!isExtracted.advicer && id !== people[i].id && id !== kidId
			),
			(extracted) => people[extracted].isExtracted.advicer,
			getLastAvaliableAdvicer
		);
		if (advicerId === null) {
			errors.somethingNull = true;
			break;
		}
		people[advicerId].isExtracted.advicer = true;

		if (DEBUG) {
			if (advicerId && kidId) {
				console.log(
					`${i} - ${people[i].name} kid-> ${people[kidId].name}\tadvicer-> ${people[advicerId].name}`
				);
			} else {
				console.log(`${i} - error -> everithing null`);
			}
		}

		result.push({ advicer: advicerId, kid: kidId, id: people[i].id });
	}

	//checking for errors
	result.forEach(({ kid, id }) => {
		if (people[id].exceptions.indexOf(kid) !== -1) {
			console.log(
				`kid is an exception: id:${id} - kid:${kid} - exceptions:${people[id].exceptions}`
			);
			errors.isExceptionThrown = true;
		}
	});

	if (arrayHasDuplicates(result.map(({ advicer }) => advicer))) {
		console.log(`advicers are duplicates: ${result.map(({ advicer }) => advicer)}`);
		errors.containsDuplicates = true;
	}
	if (arrayHasDuplicates(result.map(({ kid }) => kid))) {
		console.log(`kids are duplicates: ${result.map(({ kid }) => kid)}`);
		errors.containsDuplicates = true;
	}

	errors.advicerIsKid = result.filter(({ kid, advicer }) => kid === advicer).length !== 0;

	errors.isSomeonNotExtracted =
		people.filter(({ isExtracted }) => !isExtracted.advicer || !isExtracted.kid).length !==
		0;

	errors.isSomethingMissing = result.length !== people.length;

	console.log(`containsDuplicates -----> ${errors.containsDuplicates}`);
	console.log(`isExceptionThrown ------> ${errors.isExceptionThrown}`);
	console.log(`advicerIsKid -----------> ${errors.advicerIsKid}`);
	console.log(`somethingNull ----------> ${errors.somethingNull}`);
	console.log(`isSomeonNotExtracted ---> ${errors.isSomeonNotExtracted}`);
	console.log(`isSomethingMissing -----> ${errors.isSomethingMissing}`);
} while (Object.keys(errors).filter((key) => errors[key]).length !== 0);
if (DEBUG) {
	console.log(result);
}
console.log('SUCCESSFUL EXTRATION -------> SENDING MAIL...');

// mando mail
loginToGmail();

let html = fs.readFileSync('./mailTemplate.html', { encoding: 'utf-8' });

result.forEach(({ id, kid, advicer }) => {
	sendMail(
		SOURCE_MAIL,
		DEBUG ? SOURCE_MAIL : people[id].mail,
		'Estrazione babbo natale segreto della compagnia',
		`Ciao ${people[id].name},\nQuesta mail è SEGRETA, non farla vedere a nessuno!!!\nSarai il BABBO NATALE di ${people[kid].name}.\nIl tuo ELFO AIUTANTE sarà ${people[advicer].name}.\nP.S. VACCINATEVI SERVI DELLA DITTATURA SANITARIA E DI BILL GATES.`,
		html
			.replace('%NAME%', people[id].name)
			.replace('%KID%', people[kid].name)
			.replace('%ADVICER%', people[advicer].name)
	);
	console.log(`SENT MAIL TO -----------> ${people[id].mail}`);
});
