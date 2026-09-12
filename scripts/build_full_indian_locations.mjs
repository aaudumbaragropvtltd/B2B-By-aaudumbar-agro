import fs from 'fs';
import path from 'path';

const FULL_INDIAN_LOCATIONS = {
  // ==========================================
  // 1. ANDHRA PRADESH (26 Districts)
  // ==========================================
  "Andhra Pradesh": {
    cities: {
      "Alluri Sitharama Raju": ["Paderu", "Araku Valley", "Rampachodavaram", "Chintapalle", "Maredumilli", "Addateegala"],
      "Anakapalli": ["Anakapalle", "Atchutapuram SEZ", "Parawada Pharma City", "Elamanchili", "Narsipatnam", "Chodavaram", "Payakaraopeta", "Kasimkota"],
      "Ananthapuramu": ["Anantapur", "Guntakal", "Tadipatri", "Dharmavaram", "Uravakonda", "Pamidi", "Gooty", "Singanamala"],
      "Annamayya": ["Rayachoti", "Madanapalle", "Rajampet", "Railway Koduru", "Tamballapalle", "Pileru"],
      "Bapatla": ["Bapatla", "Chirala", "Repalle", "Addanki", "Parchur", "Vemuru", "Karlapalem"],
      "Chittoor": ["Chittoor", "Palamaner", "Kuppam", "Punganur", "Nagari", "GD Nellore", "Puthalapattu"],
      "Dr. B.R. Ambedkar Konaseema": ["Amalapuram", "Razole", "Ravulapalem", "Mandapeta", "Kothapeta", "Mummidivaram", "Ramachandrapuram"],
      "East Godavari": ["Rajahmundry", "Kovvur", "Nidadavole", "Rajanagaram", "Gopalapuram", "Anaparthi", "Korukonda"],
      "Eluru": ["Eluru", "Jangareddygudem", "Nuzvid", "Chintalapudi", "Denduluru", "Unguturu", "Kaikalur"],
      "Guntur": ["Guntur City", "Guntur Mirchi Yard", "Tenali", "Mangalagiri (AIIMS)", "Tadikonda", "Prathipadu", "Ponnur", "Chebrolu"],
      "Kakinada": ["Kakinada Port", "Kakinada SEZ", "Samalkota", "Pithapuram", "Peddapuram", "Tuni", "Yeleswaram", "Karapa"],
      "Krishna": ["Machilipatnam Port", "Gudivada", "Vuyyuru", "Avanigadda", "Pamarru", "Pedana", "Gannavaram"],
      "Kurnool": ["Kurnool City", "Adoni (Cotton Hub)", "Yemmiganur", "Kodumur", "Pattikonda", "Alur", "Mantralayam", "Gonegandla"],
      "Nandyal": ["Nandyal", "Allagadda", "Banaganapalle", "Dhone", "Nandikotkur", "Srisailam", "Atmakur"],
      "NTR (Vijayawada)": ["Vijayawada Autonagar", "Kondapalli Industrial Estate", "Gannavaram Airport Zone", "Ibrahimpatnam", "Nandigama", "Jaggayyapeta", "Tiruvuru", "Mylavaram"],
      "Palnadu": ["Narasaraopet", "Chilakaluripet", "Sattenapalle", "Gurazala", "Macherla", "Vinukonda", "Piduguralla (Lime City)"],
      "Parvathipuram Manyam": ["Parvathipuram", "Salur", "Bobbili Industrial Growth Centre", "Kurupam", "Palakonda", "Gummalakshmipuram"],
      "Prakasam": ["Ongole", "Markapur (Slate Zone)", "Giddalur", "Kanigiri", "Podili", "Darsi", "Yerragondapalem", "Chimakkurthy (Granite Hub)"],
      "Sri Potti Sriramulu Nellore": ["Nellore", "Krishnapatnam Port", "Kavali", "Gudur", "Atmakur", "Venkatagiri", "Kovur", "Naidupeta"],
      "Sri Sathya Sai": ["Puttaparthi", "Hindupur Industrial Area", "Kadiri", "Dharmavaram", "Penukonda (Kia Auto Cluster)", "Madakasira", "Gorantla"],
      "Srikakulam": ["Srikakulam", "Amadalavalasa", "Palasa (Cashew Hub)", "Tekkali", "Ichchapuram", "Sompeta", "Narasannapeta", "Rajam"],
      "Tirupati": ["Tirupati", "Renigunta Electronic SEZ", "Sri City Mega SEZ", "Srikalahasti", "Chandragiri", "Sullurpeta (ISRO Zone)", "Venkatagiri"],
      "Visakhapatnam": ["Visakhapatnam City", "Gajuwaka Autonagar", "Duvvada VSEZ", "Madhurawada IT SEZ", "Bheemunipatnam", "Pendurthi", "Rushikonda", "Steel Plant Zone"],
      "Vizianagaram": ["Vizianagaram", "Bobbili", "Gajapathinagaram", "Cheepurupalli", "Srungavarapukota", "Kothavalasa Industrial Belt", "Nellimarla"],
      "West Godavari": ["Bhimavaram (Aqua Hub)", "Tadepalligudem", "Tanuku", "Palakollu", "Narasapuram", "Akividu", "Undi"],
      "YSR Kadapa": ["Kadapa City", "Proddatur (Gold & Cotton Hub)", "Pulivendula", "Jammalamadugu", "Rayachoti", "Mydukur", "Kamalapuram", "Badvel"]
    }
  },

  // ==========================================
  // 2. ARUNACHAL PRADESH (26 Districts)
  // ==========================================
  "Arunachal Pradesh": {
    cities: {
      "Anjaw": ["Hawai", "Hayuliang", "Manchal", "Goiliang", "Walong", "Kibithu"],
      "Changlang": ["Changlang", "Miao", "Jairampur", "Bordumsa", "Diyun", "Kharsang"],
      "Dibang Valley": ["Anini", "Mipi", "Etalin", "Anelih", "Kronli"],
      "East Kameng": ["Seppa", "Chayang Tajo", "Bameng", "Pipu", "Pakke Kessang", "Seijosa"],
      "East Siang": ["Pasighat", "Ruksin", "Mebo", "Bilat", "Sille-Oyan"],
      "Kamle": ["Raga", "Dollungmukh", "Puchigeko", "Gepen", "Kamporijo"],
      "Kra Daadi": ["Jamin", "Palin", "Tali", "Chambang", "Yangte", "Pipsorang"],
      "Kurung Kumey": ["Koloriang", "Nyapin", "Sangram", "Damin", "Sarli", "Hinda"],
      "Lepa Rada": ["Basar", "Tirbin", "Daring", "Sago"],
      "Lohit": ["Tezu", "Sunpura", "Wakro", "Tafragam"],
      "Longding": ["Longding", "Kanubari", "Pangchao", "Wakka", "Pumao"],
      "Lower Dibang Valley": ["Roing", "Dambuk", "Hunli", "Desali", "Koronu"],
      "Lower Siang": ["Likabali", "Gensi", "Kangku", "Nari"],
      "Lower Subansiri": ["Ziro", "Yachuli", "Old Ziro", "Pistana", "Raga"],
      "Namsai": ["Namsai", "Chongkham", "Mahadevpur", "Piyong", "Lathao"],
      "Pakke Kessang": ["Lemmi", "Pakke Kessang", "Seijosa", "Pijerang", "Passa Valley"],
      "Papum Pare": ["Itanagar", "Naharlagun", "Doimukh", "Nirjuli", "Banderdewa", "Balijan", "Sagalee", "Kimim"],
      "Shi Yomi": ["Tato", "Mechuka", "Monigong", "Pidi"],
      "Siang": ["Boleng", "Pangin", "Rumgong", "Kaying", "Rebo-Perging"],
      "Tawang": ["Tawang", "Lumla", "Jang", "Mukto", "Kitpi", "Zemithang"],
      "Tirap": ["Khonsa", "Deomali", "Namsang", "Lazu", "Dadam"],
      "Upper Siang": ["Yingkiong", "Tuting", "Gelling", "Singa", "Mariyang", "Jengging"],
      "Upper Subansiri": ["Daporijo", "Dumporijo", "Taliha", "Nacho", "Siyum", "Baririjo"],
      "West Kameng": ["Bomdila", "Bhalukpong", "Rupa", "Dirang", "Singchung", "Kalaktang"],
      "West Siang": ["Aalo", "Liromoba", "Yomcha", "Darak", "Kamba"],
      "Capital Complex Itanagar": ["Itanagar Sector 1-4", "Ganga", "Naharlagun Industrial Estate", "Banderdewa Checkpost", "Chandranagar"]
    }
  },

  // ==========================================
  // 3. ASSAM (35 Districts)
  // ==========================================
  "Assam": {
    cities: {
      "Baksa": ["Mushalpur", "Tamulpur", "Salbari", "Goreswar", "Barama"],
      "Barpeta": ["Barpeta", "Howly", "Sarthebari", "Pathsala", "Sorbhog", "Kalgachia"],
      "Biswanath": ["Biswanath Chariali", "Gohpur", "Helem", "Behali", "Sootea"],
      "Bongaigaon": ["Bongaigaon City", "New Bongaigaon Railway Hub", "Abhayapuri", "Boitamari", "Srijangram"],
      "Cachar": ["Silchar", "Lakhipur", "Sonai", "Udarbond", "Borkhola", "Katigorah"],
      "Charaideo": ["Sonari", "Mahmora", "Sapekhati", "Borhat"],
      "Chirang": ["Kajalgaon", "Bijni", "Sidli", "Runikhata"],
      "Darrang": ["Mangaldai", "Kharupetia (Vegetable Hub)", "Sipajhar", "Dalgaon", "Patharighat"],
      "Dhemaji": ["Dhemaji", "Silapathar", "Jonai", "Gogamukh", "Sissiborgaon"],
      "Dhubri": ["Dhubri", "Gauripur", "Bilasipara", "Chapar", "Golakganj", "Agomani"],
      "Dibrugarh": ["Dibrugarh City", "Chabua", "Naharkatiya (Oil Town)", "Duliajan (OIL HQ)", "Namrup Fertilizer Town", "Moranhat"],
      "Dima Hasao": ["Haflong", "Umrangso", "Mahur", "Maibang", "Harangajao"],
      "Goalpara": ["Goalpara", "Dudhnoi", "Lakhipur", "Matia Industrial Area", "Balijana"],
      "Golaghat": ["Golaghat", "Bokakhat (Kaziranga)", "Sarupathar", "Dergaon", "Khumtai", "Numaligarh Refinery Zone"],
      "Hailakandi": ["Hailakandi", "Lala", "Katlicherra", "Algapur"],
      "Hojai": ["Hojai", "Lanka", "Doboka", "Lumding (Railway Division)"],
      "Jorhat": ["Jorhat City", "Mariani", "Titabar", "Teok", "Majuli Ferry Ghat", "Cinnamara Tea Hub"],
      "Kamrup": ["Amingaon Inland Container Depot", "Palasbari", "Rangia", "Chaygaon Industrial Park", "Mirza", "Boko", "North Guwahati", "Hajo"],
      "Kamrup Metropolitan": ["Guwahati City", "Dispur Capital Complex", "Bamunimaidam Industrial Estate", "Khanapara", "Beltola Trade Centre", "Panbazar", "Jalukbari", "Borjhar Airport"],
      "Karbi Anglong": ["Diphu", "Bokajan Cement Town", "Howraghat", "Manja", "Dokmoka"],
      "Karimganj": ["Karimganj", "Badarpur", "Ramkrishna Nagar", "Patharkandi", "Nilambazar"],
      "Kokrajhar": ["Kokrajhar", "Gossaigaon", "Fakiragram", "Dotma"],
      "Lakhimpur": ["North Lakhimpur", "Bihpuria", "Narayanpur", "Dhakuakhana", "Nowboicha"],
      "Majuli": ["Garamur", "Kamalabari", "Jengraimukh", "Auniati"],
      "Morigaon": ["Morigaon", "Jagiroad (Paper & Tech Park)", "Mayong", "Laharighat", "Bhuragaon"],
      "Nagaon": ["Nagaon City", "Kaliabor", "Raha", "Dhing", "Samaguri", "Kampur"],
      "Nalbari": ["Nalbari", "Tihu", "Barkshetri", "Ghograpar", "Barbhitha"],
      "Sivasagar": ["Sivasagar", "Nazira (ONGC Base)", "Amguri", "Demow", "Gaurisagar"],
      "Sonitpur": ["Tezpur", "Dhekiajuli", "Rangapara", "Jamugurihat", "Balipara Industrial Park"],
      "South Salmara-Mankachar": ["Hatsingimari", "Mankachar", "South Salmara", "Sukchar"],
      "Tamulpur": ["Tamulpur", "Nagrijuli", "Kumarikata", "Goreswar"],
      "Tinsukia": ["Tinsukia Industrial Hub", "Digboi (Asia's 1st Refinery)", "Doomdooma Tea Zone", "Margherita Coal Hub", "Ledo", "Sadiya", "Makum"],
      "Udalguri": ["Udalguri", "Tangla", "Rowta", "Khoirabari", "Bhairabkunda"],
      "West Karbi Anglong": ["Hamren", "Baithalangso", "Donkamukam", "Kheroni"],
      "Bajali": ["Pathsala", "Sarupeta", "Bhowanipur", "Jalah"]
    }
  },

  // ==========================================
  // 4. BIHAR (38 Districts)
  // ==========================================
  "Bihar": {
    cities: {
      "Araria": ["Araria", "Forbesganj (Mandi Hub)", "Raniganj", "Jogbani (Indo-Nepal Border)", "Jokihat", "Bhargama"],
      "Arwal": ["Arwal", "Kaler", "Karpi", "Kurtha", "Sonbhadra Banshi Suryapur"],
      "Aurangabad": ["Aurangabad", "Daudnagar", "Obra", "Nabinagar Power Hub", "Rafiganj", "Goh", "Barun Industrial Zone"],
      "Banka": ["Banka", "Amarpur", "Katoria", "Bounsi", "Barahat", "Chandan"],
      "Begusarai": ["Begusarai", "Barauni Industrial Area (Refinery & Fertilizer)", "Teghra", "Bakhri", "Ballia", "Manjhaul", "Sahebpur Kamal"],
      "Bhagalpur": ["Bhagalpur Silk Hub", "Barari Industrial Area", "Kahalgaon Super Thermal Zone", "Nathnagar", "Sultanganj", "Naugachia (Banana Mandi)", "Colgong"],
      "Bhojpur (Ara)": ["Ara City", "Jagdishpur", "Piro", "Bihiya Industrial Estate", "Koilwar", "Sandesh", "Shahpur"],
      "Buxar": ["Buxar", "Dumraon", "Chaugain", "Itarhi", "Brahmpur", "Nawanagar"],
      "Darbhanga": ["Darbhanga City", "Benipur", "Biraul", "Laheriasarai", "Keoti", "Baheri", "Hayaghat"],
      "East Champaran (Motihari)": ["Motihari", "Raxaul (Dry Port / Nepal Border)", "Chakia", "Dhaka", "Areraj", "Pakridayal", "Mehsi (Button Hub)"],
      "Gaya": ["Gaya City", "Bodh Gaya", "Sherghati", "Tekari", "Manpur (Textile Hub)", "Dobhi Industrial Corridor", "Wazirganj"],
      "Gopalganj": ["Gopalganj", "Hathwa", "Mirganj", "Barauli", "Kuchaikote", "Sidhwalia (Sugar Mills)"],
      "Jamui": ["Jamui", "Jhajha Railway Hub", "Gidhaur", "Sono", "Chakai", "Sikandra"],
      "Jehanabad": ["Jehanabad", "Makhdumpur", "Kako", "Ghoshi", "Ratni Faridpur"],
      "Kaimur (Bhabua)": ["Bhabua", "Mohania Industrial Belt", "Ramgarh", "Chainpur", "Kudra (Rice Mill Hub)", "Durgawati"],
      "Katihar": ["Katihar City", "Barsoi Railway Hub", "Manihari Port", "Korha", "Kadwa", "Azamnagar"],
      "Khagaria": ["Khagaria", "Gogri Jamalpur", "Parbatta", "Beldaur", "Alauli", "Mansi"],
      "Kishanganj": ["Kishanganj (Tea Hub)", "Bahadurganj", "Thakurganj", "Pothia", "Dighalbank", "Kochadhaman"],
      "Lakhisarai": ["Lakhisarai", "Barahiya", "Surajgarha", "Pipariya", "Halsi"],
      "Madhepura": ["Madhepura", "Alstom Electric Loco Factory Zone", "Singheshwar", "Murliganj", "Bihariganj", "Puraini"],
      "Madhubani": ["Madhubani", "Jhanjharpur", "Benipatti", "Jaynagar Border Port", "Phulparas", "Pandaul Industrial Estate", "Sakri"],
      "Munger": ["Munger City", "Jamalpur Railway Workshop", "Haveli Kharagpur", "Tarapur", "Bariarpur"],
      "Muzaffarpur": ["Muzaffarpur City", "Bela Industrial Area", "Motipur Mega Food Park", "Kanti Thermal Zone", "Sakra", "Marwan", "Sahebganj"],
      "Nalanda (Bihar Sharif)": ["Bihar Sharif", "Rajgir Tourism & Tech SEZ", "Hilsa", "Islampur", "Harnaut Railway Coach Factory", "Noorsarai", "Silao"],
      "Nawada": ["Nawada", "Rajauli", "Hisua", "Pakribarawan", "Warisaliganj", "Govindpur"],
      "Patna": ["Patliputra Industrial Area", "Fatuha Industrial Area", "Bihta Mega Industrial & Logistics Hub", "Didarganj", "Danapur", "Bakhtiyarpur", "Mokama Industrial Area", "Phulwari Sharif", "Patna City Mandi"],
      "Purnia": ["Purnia City", "Maranga Industrial Growth Centre", "Banmankhi", "Dhamdaha", "Baisi", "Kasba", "Rupauli"],
      "Rohtas (Sasaram)": ["Sasaram", "Dehri-on-Sone", "Dalmianagar Industrial Complex", "Nokha (Rice Mills)", "Bikramganj", "Karakat", "Chenari"],
      "Saharsa": ["Saharsa", "Simri Bakhtiarpur", "Sonbarsa", "Sour Bazar", "Kahra", "Nauhatta"],
      "Samastipur": ["Samastipur Railway Division", "Dalsinghsarai (Tobacco & Spice Hub)", "Rosera", "Pusa Agricultural University Zone", "Shahpur Patori", "Tajpur"],
      "Saran (Chhapra)": ["Chhapra", "Marhaura (GE Diesel Locomotive Works)", "Sonpur", "Revelganj", "Dighwara", "Garkha", "Parsa"],
      "Sheikhpura": ["Sheikhpura", "Barbigha", "Ariari", "Chewara", "Ghatkusumbha"],
      "Sheohar": ["Sheohar", "Tariyani", "Dumri Katsari", "Piprahi", "Purnahiya"],
      "Sitamarhi": ["Sitamarhi", "Bairgania", "Belsand", "Pupri", "Dumra", "Sursand", "Riga (Sugar Mill Zone)"],
      "Supaul": ["Supaul", "Birpur (Indo-Nepal Border)", "Triveniganj", "Nirmali", "Pipra", "Chhatapur"],
      "Siwan": ["Siwan", "Maharajganj", "Mairwa", "Andar", "Raghunathpur", "Barharia", "Goreakothi"],
      "Vaishali (Hajipur)": ["Hajipur Industrial Area (EPPIP / EPIP)", "Lalganj", "Mahua", "Mahnar", "Bidupur", "Bhagwanpur", "Patepur"],
      "West Champaran (Bettiah)": ["Bettiah", "Bagaha", "Narkatiaganj (Sugar Hub)", "Ramnagar", "Chanpatia Textile Startup Zone", "Majhaulia", "Gaunaha"]
    }
  },

  // ==========================================
  // 5. CHHATTISGARH (33 Districts)
  // ==========================================
  "Chhattisgarh": {
    cities: {
      "Balod": ["Balod", "Dalli Rajhara (Iron Ore Mines)", "Gunderdehi", "Donde Lohara", "Gurur"],
      "Baloda Bazar-Bhatapara": ["Baloda Bazar", "Bhatapara (Cement Hub & Grain Mandi)", "Simga", "Kasdol", "Palari", "Lawon"],
      "Balrampur-Ramanujganj": ["Balrampur", "Ramanujganj", "Rajpur", "Kusmi", "Shankargarh", "Wadrafnagar"],
      "Bastar (Jagdalpur)": ["Jagdalpur", "Nagarnar NMDC Steel Plant Zone", "Bastar", "Tokapal", "Lohandiguda", "Bakawand", "Bastanar"],
      "Bemetara": ["Bemetara", "Saja", "Berla", "Nawagarh", "Thanakhamria"],
      "Bijapur": ["Bijapur", "Bhopalpattnam", "Bhairamgarh", "Usur"],
      "Bilaspur": ["Bilaspur City", "Tifra Industrial Area", "Sirgitti Industrial Area", "Chakarbhata", "Kota", "Takhatpur", "Masturi", "Bilha"],
      "Dakshin Bastar Dantewada": ["Dantewada", "Kirandul NMDC Mining Zone", "Bacheli NMDC Complex", "Geedam", "Kukanar", "Katekalyan"],
      "Dhamtari": ["Dhamtari (Rice Mill Hub)", "Kurud Industrial Area", "Nagri", "Magarlod", "Bhakhara"],
      "Durg": ["Bhilai Steel Plant Zone", "Borai Industrial Growth Centre", "Durg City", "Kumhari Industrial Belt", "Patan", "Dhamdha", "Jamul Cement Zone"],
      "Gariaband": ["Gariaband", "Rajim", "Chhura", "Mainpur", "Deobhog"],
      "Gaurela-Pendra-Marwahi": ["Gaurela", "Pendra", "Marwahi", "Pasan"],
      "Janjgir-Champa": ["Janjgir", "Champa (Kosa Silk & Thermal Hub)", "Akaltara Cement Zone", "Nawaagarh", "Pamgarh", "Baloda", "Shivrinarayan"],
      "Jashpur": ["Jashpur Nagar", "Kunkuri", "Pathalgaon (Tea & Agri Mandi)", "Bagicha", "Manoora", "Duldula"],
      "Kabirdham (Kawardha)": ["Kawardha", "Pandariya", "Bodla", "Sahaspur Lohara"],
      "Kanker (North Bastar)": ["Kanker", "Charama", "Antagarh", "Pakhanjur", "Narharpur", "Bhanupratappur"],
      "Khairagarh-Chhuikhadan-Gandai": ["Khairagarh", "Chhuikhadan", "Gandai", "Salhewara"],
      "Kondagaon": ["Kondagaon (Bell Metal Hub)", "Keshkal", "Makdi", "Faraskgaon", "Bade Rajpur"],
      "Korba": ["Korba Coal & Power Capital", "BALCO Aluminium Zone", "NTPC Jamnipali", "Katghora", "Pali", "Deepka SECL Coal Mines", "Gevra"],
      "Koriya": ["Baikunthpur", "Sonhat", "Chirmiri Coal Belt", "Manendragarh", "Khongapani"],
      "Mahasamund": ["Mahasamund", "Saraipali", "Pithora", "Basna", "Bagbahara", "Birgaon"],
      "Manendragarh-Chirmiri-Bharatpur": ["Manendragarh", "Chirmiri", "Bharatpur", "Janakpur", "Khadgawan"],
      "Mohla-Manpur-Ambagarh Chowki": ["Mohla", "Manpur", "Ambagarh Chowki"],
      "Mungeli": ["Mungeli", "Lormi", "Pathariya"],
      "Narayanpur": ["Narayanpur", "Orchha (Abujhmad)", "Chhota Dongar"],
      "Raigarh": ["Raigarh (Jindal Steel Hub)", "Jindal Industrial Park", "Gharghoda", "Kharsia (Grain Mandi)", "Sarangarh", "Tamnar Power Hub", "Pussore"],
      "Raipur": ["Urla Industrial Growth Centre", "Siltara Mega Industrial Complex", "Bhanpuri", "Rawabhata", "Birgaon", "Tilda Newra", "Abhanpur", "Naya Raipur Atal Nagar Smart City", "Arang"],
      "Rajnandgaon": ["Rajnandgaon", "Teddy Industrial Area", "Dongargarh", "Dongargaon", "Chhuria", "Khujji"],
      "Sakti": ["Sakti", "Dabhra", "Malkharoda", "Jaijaipur"],
      "Sarangarh-Bilaigarh": ["Sarangarh", "Bilaigarh", "Baramkela", "Bhatgaon"],
      "Sukma": ["Sukma", "Konta Port Area", "Dornapal", "Chintagufa"],
      "Surajpur": ["Surajpur", "Bishrampur Coal Belt", "Bhaiyathan", "Pratappur", "Premnagar", "Odgi"],
      "Surguja (Ambikapur)": ["Ambikapur", "Sitapur", "Lundra", "Mainpat", "Udaipur", "Lakhanpur", "Bataikela"]
    }
  },

  // ==========================================
  // 6. GOA (2 Districts)
  // ==========================================
  "Goa": {
    cities: {
      "North Goa": ["Panaji Capital City", "Mapusa", "Tivim Industrial Estate", "Pissurlem Industrial Estate", "Ponda Industrial Belt", "Kundaim Industrial Estate", "Bicholim Industrial Estate", "Corlim Industrial Estate", "Tuem Electronic City", "Calangute", "Porvorim"],
      "South Goa": ["Margao Commercial Capital", "Vasco da Gama Port City", "Verna Industrial Estate (Pharma & Tech Hub)", "Cuncolim Industrial Estate", "Curchorem Mining Zone", "Sanguem", "Canacona", "Quepem", "Dabolim Airport Belt", "Mormugao Port"]
    }
  },

  // ==========================================
  // 7. GUJARAT (33 Districts)
  // ==========================================
  "Gujarat": {
    cities: {
      "Ahmedabad": ["Sanand GIDC (Auto Hub)", "Changodar GIDC", "Vatva GIDC", "Naroda GIDC", "Odhav GIDC", "Bavla Industrial Area", "Dholera Special Investment Region (SIR)", "Viramgam", "Dholka", "Mandal GIDC", "Kathwada GIDC", "Aslali Logistics Hub", "Bareja", "Sarkhej"],
      "Amreli": ["Amreli", "Pipavav Port SEZ", "Rajula", "Savarkundla", "Bagasara", "Dhari", "Jafrabad", "Lathi", "Babra", "Khambha"],
      "Anand": ["Vitthal Udyognagar GIDC", "Anand City (Amul Dairy Capital)", "Khambhat", "Petlad", "Borsad", "Umreth", "Tarapur GIDC", "Sojitra", "Vallabh Vidyanagar"],
      "Aravalli": ["Modasa", "Malpur", "Bayad", "Dhansura", "Meghraj", "Bhiloda", "Shamlaji"],
      "Banaskantha (Palanpur)": ["Palanpur", "Deesa (Potato Capital)", "Dhanera", "Tharad (Dry Port Corridor)", "Vav", "Bhabhar", "Danta", "Amirgadh", "Kankrej", "Shihori"],
      "Bharuch": ["Ankleshwar GIDC (Chemical Hub)", "Dahej PCPIR SEZ & Deepwater Port", "Panoli GIDC", "Jhagadia GIDC", "Bharuch City", "Vilayat Industrial Estate", "Amod", "Vagra", "Hansot", "Jambusar"],
      "Bhavnagar": ["Chitra GIDC", "Alang Ship Recycling Yard", "Sihor Steel Rolling Hub", "Palitana", "Talaja", "Mahuva (Dehydration & Onion Hub)", "Gariadhar", "Vallabhipur", "Ghogha Ro-Ro Terminal", "Umrala"],
      "Botad": ["Botad (Diamond Hub)", "Gadhada", "Barwala", "Ranpur"],
      "Chhota Udaipur": ["Chhota Udaipur", "Bodeli", "Sankheda", "Pavi Jetpur", "Nasvadi", "Kavant"],
      "Dahod": ["Dahod (Locomotive Works)", "Jhalod", "Garbada", "Limkheda", "Devgadh Baria", "Dhanpur", "Fatepura", "Sanjeli"],
      "Dang (Ahwa)": ["Ahwa", "Waghai", "Subir", "Saputara"],
      "Devbhumi Dwarka": ["Khambhalia", "Dwarka", "Okha Port", "Kalyanpur (Bauxite Hub)", "Bhanvad", "Mithapur (Tata Chemicals Zone)"],
      "Gandhinagar": ["Gandhinagar Capital City", "GIFT City Financial SEZ", "Kalol GIDC", "Koba", "Chhatral GIDC", "Mansa", "Dehgam", "Pethapur"],
      "Gir Somnath": ["Veraval (Fisheries & Rayon Hub)", "Somnath", "Talala (Kesar Mango Hub)", "Kodinar (Sugar & Cement)", "Una", "Sutrapada", "Gir Gadhada"],
      "Jamnagar": ["Jamnagar City (Brass Parts Hub)", "Reliance Greens / Moti Khavdi Refinery", "Nayara Energy Vadinar Refinery", "Drol", "Kalavad", "Lalpur", "Jamjodhpur", "Jodiya", "Bedeshwar GIDC"],
      "Junagadh": ["Junagadh", "Keshod", "Mangrol Port", "Manavadar (Cotton Hub)", "Visavadar", "Vanthali", "Malia Hatina", "Bhesan"],
      "Kheda (Nadiad)": ["Nadiad", "Kheda GIDC", "Kapadvanj", "Matar", "Mahudha", "Thasra", "Kathlal", "Galteshwar", "Vaso"],
      "Kutch (Bhuj / Gandhidham)": ["Kandla Port (Deendayal Port Trust)", "Mundra Port & Adani SEZ", "Gandhidham Commercial Capital", "Anjar Welspun Pipe Zone", "Bhuj", "Mandvi Port", "Nakhatrana", "Bhachau Industrial Belt", "Rapar", "Lakhpat", "Samakhiali Logistics Hub"],
      "Mahisagar": ["Lunawada", "Santrampur", "Kadana", "Balasinor", "Virpur", "Khanpur"],
      "Mehsana": ["Mehsana GIDC", "Kadi GIDC (Ceramic & Cotton Hub)", "Becharaji (Maruti Suzuki Auto SEZ)", "Unjha (Asia's Largest Spice Mandi)", "Visnagar", "Vadnagar", "Kheralu", "Vijapur", "Jotana"],
      "Morbi": ["Morbi Ceramic & Tile Capital", "Wankaner GIDC", "Halvad (Salt & Cotton Hub)", "Maliya Miyana", "Tankara"],
      "Narmada (Rajpipla)": ["Rajpipla", "Kevadia (Ekta Nagar / Statue of Unity)", "Nandod", "Dediapada", "Tilakwada", "Sagbara", "Garudeshwar"],
      "Navsari": ["Navsari (Diamond & Silk)", "Bilimora Port & Industrial Town", "Gandevi", "Jalalpore", "Chikhli", "Vansda", "Khergam"],
      "Panchmahal (Godhra)": ["Godhra", "Halol GIDC (Auto & Engineering Hub)", "Kalol Industrial Belt", "Shehra", "Ghoghamba", "Jambughoda", "Morwa Hadaf"],
      "Patan": ["Patan (Patola Silk Hub)", "Radhanpur", "Sidhpur (Isabgol Mandi)", "Chanasma", "Harij", "Sami", "Shankheshwar", "Santalpur"],
      "Porbandar": ["Porbandar Port & Chemical Zone", "Ranavav Cement Hub", "Kutiyana", "Madhavpur", "Chhaya"],
      "Rajkot": ["Aji GIDC", "Bhakti Nagar GIDC", "Metoda GIDC", "Shapar-Veraval GIDC (Auto Engineering)", "Kuvadva GIDC", "Gondal (Oil & Agri Mandi)", "Jetpur (Textile Dyeing Capital)", "Dhoraji", "Upleta", "Jasdan", "Lodhika GIDC", "Kotda Sangani", "Paddhari"],
      "Sabarkantha (Himmatnagar)": ["Himmatnagar GIDC (Ceramics)", "Prantij GIDC", "Talod", "Idar", "Khedbrahma", "Vadali", "Poshina", "Vijaynagar"],
      "Surat": ["Sachin GIDC & Surat Diamond Bourse", "Pandesara GIDC", "Hazira Industrial Belt (L&T, Reliance, AMNS)", "Katargam", "Varachha", "Udhna", "Ichhapore GIDC (Gems & Jewellery SEZ)", "Olpad", "Bardoli", "Kamrej", "Palsana Industrial Zone", "Mandvi", "Mahuva"],
      "Surendranagar": ["Surendranagar", "Wadhwan GIDC", "Thangadh (Sanitaryware Hub)", "Dhrangadhra (Chemicals & Salt)", "Chotila", "Limbdi", "Patdi (Little Rann Salt)", "Sayla", "Muli", "Chuda"],
      "Tapi (Vyara)": ["Vyara", "Songadh (Paper Mill Hub)", "Valod", "Nizar", "Uchchhal", "Kukarmunda", "Dolvan"],
      "Vadodara": ["Makarpura GIDC", "Nandesari GIDC (Chemical Hub)", "Savli GIDC (Engineering & Metro Coach Hub)", "Manjusar GIDC", "Padra Chemical Belt", "Waghodia GIDC", "Por GIDC", "Karjan", "Dabhoi", "Ranoli", "Koyali (IOCL Refinery Zone)"],
      "Valsad": ["Valsad", "Vapi GIDC (Asia's Chemical Hub)", "Umbergaon GIDC", "Pardi", "Dharampur", "Kaprada", "Bhilad GIDC", "Sarigam GIDC"]
    }
  },

  // ==========================================
  // 8. HARYANA (22 Districts)
  // ==========================================
  "Haryana": {
    cities: {
      "Ambala": ["Ambala Cantt Scientific Instruments Hub", "Ambala City", "Barara", "Naraingarh", "Saha Growth Centre", "Mullana"],
      "Bhiwani": ["Bhiwani Textile Town", "Tosham", "Siwani", "Loharu", "Bawani Khera"],
      "Charkhi Dadri": ["Charkhi Dadri", "Badhra", "Jhook", "Bond Kalan"],
      "Faridabad": ["Sector 24/25 Industrial Area", "Ballabgarh", "NH-5 Industrial Zone", "Prithla Industrial Corridor", "Sikri", "Tigaon", "Faridabad NIT", "Sector 58/59"],
      "Fatehabad": ["Fatehabad", "Tohana (Grain Mandi)", "Ratia", "Bhattu Kalan", "Bhuna"],
      "Gurugram": ["Udyog Vihar Phases 1-5", "Manesar IMT Auto Hub", "Sector 37 Pace City", "Sohna Industrial & Logistics Hub", "Pataudi", "Farrukhnagar Warehousing Zone", "Cyber City / DLF", "Kadipur", "Daulatabad Industrial Area"],
      "Hisar": ["Hisar Steel City", "Hansi", "Barwala", "Narnaund", "Uklana Mandi", "Adampur"],
      "Jhajjar": ["Jhajjar", "Bahadurgarh Modern Industrial Estate (MIE)", "Jhajjar Footwear Park", "Beri", "Badli", "Matanhail (Power Plants)"],
      "Jind": ["Jind", "Narwana", "Safidon", "Uchana", "Julana", "Pilu Khera"],
      "Kaithal": ["Kaithal (Rice Mill Hub)", "Guhla-Cheeka", "Kalayat", "Pundri", "Rajound"],
      "Karnal": ["Karnal City", "Taraori (Basmati Rice Capital)", "Gharaunda", "Assandh", "Indri", "Nilokheri", "Kunjpura"],
      "Kurukshetra": ["Thanesar / Kurukshetra", "Pehowa", "Shahbad (Markanda)", "Ladwa", "Babain", "Ismailabad"],
      "Mahendragarh (Narnaul)": ["Narnaul Integrated Logistics Hub", "Mahendragarh", "Ateli", "Kanina", "Nangal Chaudhry Multi-Modal Logistics Park"],
      "Nuh (Mewat)": ["Nuh", "Tauru Logistics Zone", "Ferozepur Jhirka", "Punhana", "Nagina"],
      "Palwal": ["Palwal", "Hodal", "Hathin", "Prithla Industrial Area", "Baghaula Industrial Corridor", "Hassanpur"],
      "Panchkula": ["Panchkula Industrial Area Phases 1-2", "Kalka", "Pinjore HMT Zone", "Barwala Industrial Estate", "Raipur Rani", "Morni"],
      "Panipat": ["Panipat Textile & Yarn Capital", "Sector 25 Industrial Area", "Panipat Refinery Complex (IOCL)", "Samalkha Industrial Area", "Israna", "Bapoli", "Madlauda"],
      "Rewari": ["Dharuhera Industrial Growth Centre", "Bawal IMT Japanese Industrial Zone", "Rewari City", "Kosli", "Manethi", "Jatusana"],
      "Rohtak": ["Rohtak IMT Industrial Park", "Sampla", "Meham", "Kalanaur", "Asthal Bohar"],
      "Sirsa": ["Sirsa (Cotton & Grain Hub)", "Mandi Dabwali", "Ellenabad", "Rania", "Kalanwali"],
      "Sonipat": ["Kundli Industrial Area (KMP Corridor)", "Rai Industrial Area (HSIIDC)", "Barhi Food Park (Mega Food Zone)", "Sonipat City", "Gohana", "Ganaur International Horticulture Market", "Murthal Industrial Belt", "Kharkhoda (Maruti Plant)"],
      "Yamunanagar": ["Yamunanagar (Plywood & Paper Hub)", "Jagadhri (Brass & Metal Ware)", "Radaur", "Chhachhrauli", "Bilaspur", "Sadhaura"]
    }
  },

  // ==========================================
  // 9. HIMACHAL PRADESH (12 Districts)
  // ==========================================
  "Himachal Pradesh": {
    cities: {
      "Bilaspur": ["Bilaspur", "Barmana (ACC Cement Hub)", "Ghumarwin", "Jhandutta", "Swarghat", "Naina Devi"],
      "Chamba": ["Chamba", "Dalhousie", "Chowari", "Killar (Pangi)", "Bharmour", "Salooni"],
      "Hamirpur": ["Hamirpur", "Nadaun", "Barsar", "Bhoranj", "Sujanpur Tira"],
      "Kangra (Dharamshala)": ["Dharamshala", "Kangra", "Palampur (Tea Capital)", "Nurpur", "Dehra Gopipur", "Jawali", "Baijnath", "Shahpur", "Nagrota Bagwan", "Fatehpur"],
      "Kinnaur (Reckong Peo)": ["Reckong Peo", "Kalpa", "Pooh", "Nichar", "Sangla Valley", "Morang"],
      "Kullu": ["Kullu", "Manali", "Bhuntar Airport Zone", "Banjar", "Anni", "Nirmand"],
      "Lahaul and Spiti": ["Keylong", "Kaza", "Udaipur", "Jispa", "Sissu", "Tabo"],
      "Mandi": ["Mandi", "Sundernagar Industrial Town", "Sarkaghat", "Jogindernagar", "Karsog", "Gohar", "Padhar", "Balh Valley"],
      "Shimla": ["Shimla Capital City", "Rampur Bushahr", "Theog", "Rohru (Apple Capital)", "Kotkhai", "Jubbal", "Chopal", "Kumarsain", "Dhalli"],
      "Sirmaur (Nahan)": ["Nahan", "Paonta Sahib Industrial Hub (Pharma)", "Kala Amb Industrial Area", "Rajgarh", "Shillai", "Sarahan", "Dadahu"],
      "Solan": ["Baddi-Barotiwala-Nalagarh (BBN Asia Pharma Capital)", "Parwanoo Industrial Area", "Solan Mushroom City", "Kandaghat", "Arki", "Darlaghat Ambuja Cement Zone"],
      "Una": ["Una", "Mehatpur Industrial Area", "Tahliwal Industrial Area", "Gagret Industrial Zone", "Amb", "Haroli", "Bangana"]
    }
  },

  // ==========================================
  // 10. JHARKHAND (24 Districts)
  // ==========================================
  "Jharkhand": {
    cities: {
      "Bokaro": ["Bokaro Steel City", "Balidih Industrial Area (BIADA)", "Chas Commercial Hub", "Bermo Coal Belt", "Gomia (Explosives Hub)", "Chandrapura", "Tenughat", "Petarwar"],
      "Chatra": ["Chatra", "Tandwa NTPC & CCL Zone", "Simaria", "Hunterganj", "Itkhori", "Pratappur"],
      "Deoghar": ["Deoghar (Baba Baidyanath)", "Madhupur Railway Hub", "Jasidih Industrial Area", "Sarath", "Mohanpur", "Karon"],
      "Dhanbad": ["Dhanbad Coal Capital of India", "Govindpur Industrial Area", "Jharia Coal Belt", "Katras", "Nirsa Industrial Area", "Sindri Fertilizer & Cement", "Barwadda", "Tundi"],
      "Dumka": ["Dumka", "Jama", "Jarmundi", "Ranishwar", "Shikaripara Stone Mining", "Saraiyahat"],
      "East Singhbhum (Jamshedpur)": ["Jamshedpur Tata Steel & Auto Hub", "Adityapur Industrial Area (AIADA)", "Bistupur", "Sakchi", "Gamharia", "Telco", "Ghatshila (Copper Mines)", "Musabani", "Jaduguda (Uranium Zone)", "Baharagora Logistics Hub", "Potka"],
      "Garhwa": ["Garhwa", "Nagar Untari", "Meral", "Ranka", "Majhiaon", "Bhavnathpur (Limestone)"],
      "Giridih": ["Giridih (Steel & Mica)", "Koderma Border Belt", "Dumri", "Bagodar", "Deori", "Birni", "Gandey"],
      "Godda": ["Godda", "Mahagama (Adani Power Zone)", "Lalmatia Coal Mines", "Poreyahat", "Boarijor", "Meherma"],
      "Gumla": ["Gumla", "Ghaghra", "Sisai", "Bishunpur", "Raidih", "Palkot", "Chainpur"],
      "Hazaribagh": ["Hazaribagh", "Barkagaon Coal Mining", "Barhi Industrial & Logistics Park", "Chauparan", "Bishnugarh", "Katkamsandi", "Daroo"],
      "Jamtara": ["Jamtara", "Mihijam (Chittaranjan Locomotive Border)", "Kundhit", "Nala", "Narayanpur"],
      "Khunti": ["Khunti (Lac Hub)", "Murhu", "Torpa", "Karra", "Rania"],
      "Koderma": ["Koderma (Mica Capital)", "Jhumri Telaiya", "Domchanch (Quartz & Granite)", "Satgawan", "Jainagar", "Chandwara"],
      "Latehar": ["Latehar", "Chandwa Power Hub", "Balumath Coal Corridor", "Mahuadanr", "Garu", "Barwadih"],
      "Lohardaga": ["Lohardaga (Bauxite Capital - Hindalco)", "Kisko", "Kuru", "Senha", "Bhandra", "Peshrar"],
      "Pakur": ["Pakur (Stone & Black Granite Hub)", "Hiranpur", "Littipara", "Amrapara", "Maheshpur", "Pakuria"],
      "Palamu (Medininagar / Daltonganj)": ["Medininagar / Daltonganj", "Chhatarpur", "Hussainabad / Japla Cement Zone", "Hariharganj", "Satbarwa", "Panki", "Lesliganj"],
      "Ramgarh": ["Ramgarh Cantt", "Patratu Industrial & Thermal Hub", "Bhurkunda Coal Belt", "Gola", "Mandu", "Chitarpur"],
      "Ranchi": ["Tupudana Industrial Area", "Tatisilwai Industrial Area", "Kokar Industrial Estate", "Namkum Industrial Belt", "Hatia (HEC Zone)", "Kanke", "Ratu", "Ormanjhi", "Nagri", "Dhurwa"],
      "Sahebganj": ["Sahebganj Multi-Modal Ganga Port", "Rajmahal Coal Mines", "Barharwa Railway Hub", "Taljhari", "Udhwa", "Borio"],
      "Seraikela Kharsawan": ["Seraikela", "Adityapur Auto Cluster", "Gamharia Industrial Belt", "Kandra Industrial Zone", "Chandu", "Kharsawan", "Chakradharpur Border"],
      "Simdega": ["Simdega", "Kolebira", "Bano Railway Hub", "Kurdeg", "Jaldega", "Thethaitangar"],
      "West Singhbhum (Chaibasa)": ["Chaibasa (Tassar Silk)", "Noamundi (Tata Iron Ore Mines)", "Gua Mines", "Kiriburu-Meghahatuburu (SAIL Mines)", "Chakradharpur Railway Division", "Jhinkpani (ACC Cement)", "Manoharpur", "Jagannathpur"]
    }
  },

  // ==========================================
  // 11. KARNATAKA (31 Districts)
  // ==========================================
  "Karnataka": {
    cities: {
      "Bagalkote": ["Bagalkote", "Jamkhandi", "Mudhol (Cement & Sugar)", "Badami", "Ilkal (Granite & Sarees)", "Guledgudda", "Hunagund", "Bilagi", "Mahalingpur"],
      "Ballari": ["Ballari City", "Sandur (Iron Ore Mining)", "Siruguppa (Rice Mill Hub)", "Kampli (Sugar & Paddy)", "Kurugodu", "Kudligi"],
      "Belagavi": ["Machhe Industrial Area", "Udyambag Foundry Cluster", "Kanabargi", "Bailhongal", "Gokak (Textile Mills)", "Chikkodi", "Athani (Sugar Capital)", "Hukkeri", "Ramdurg", "Saundatti", "Khanapur", "Raybag", "Nipani (Tobacco Mandi)"],
      "Bengaluru Rural": ["Doddaballapur Industrial Area", "Hosakote Auto & Warehousing Hub", "Devanahalli IT & Aerospace SEZ", "Nelamangala Logistics Hub", "Dasanapura APMC Mandi"],
      "Bengaluru Urban": ["Peenya Industrial Estate (Asia's Largest)", "Electronic City IT Hub", "Whitefield EPIP Zone", "Bommasandra Industrial Area", "Jigani Industrial Area", "Attibele Industrial Belt", "Yelahanka", "Hoodi", "Koramangala", "Rajajinagar Industrial Town"],
      "Bidar": ["Bidar", "Humnabad Industrial Area", "Bhalki", "Basavakalyan", "Aurad", "Chitgoppa"],
      "Chamarajanagar": ["Chamarajanagar", "Gundlupet", "Kollegal (Silk City)", "Yelandur", "Hanur", "Kallambella"],
      "Chikkaballapura": ["Chikkaballapura", "Gowribidanur Industrial Area", "Sidlaghatta (Silk Cocoon Market)", "Chintamani", "Bagepalli", "Gudibande"],
      "Chikkamagaluru": ["Chikkamagaluru (Coffee Capital)", "Kadur", "Tarikere", "Mudigere", "Koppa", "Sringeri", "Narasimharajapura", "Kalasa"],
      "Chitradurga": ["Chitradurga", "Challakere (Oil City / Science City)", "Hiriyur (Sugar Mills)", "Hosadurga", "Holalkere", "Molakalmuru (Silk Sarees)"],
      "Dakshina Kannada (Mangaluru)": ["Mangaluru City", "Baikampady Industrial Estate", "New Mangalore Port SEZ (NMPT)", "Surathkal", "Panambur Petrochemical Zone", "Bantwal", "Puttur", "Belthangady", "Sullia", "Moodbidri", "Kadaba"],
      "Davanagere": ["Davanagere (Textile Hub)", "Harihar Industrial Town (Polyfibres)", "Channagiri (Arecanut Hub)", "Honnali", "Nyamathi", "Jagalur"],
      "Dharwad": ["Hubballi Commercial Hub", "Tarihal Industrial Estate", "Gokul Road Industrial Area", "Rayapur Industrial Corridor", "Dharwad City", "Navalgund", "Kundgol", "Kalghatgi", "Alnavar"],
      "Gadag": ["Gadag-Betageri", "Mundargi", "Nargund", "Ron", "Shirhatti", "Gajendragad"],
      "Hassan": ["Hassan Industrial Growth Centre", "Belur", "Holenarasipura", "Channarayapatna", "Sakleshpur (Spices & Coffee)", "Arsikere (Coconut Mandi)", "Alur", "Arkalgud"],
      "Haveri": ["Haveri (Byadgi Chilli Mandi)", "Byadgi", "Ranebennur (Seed Hub)", "Hangal", "Shiggaon", "Hirekerur", "Savanur", "Rattihalli"],
      "Kalaburagi (Gulbarga)": ["Kalaburagi City", "Kapnoor Industrial Area", "Sedam (Cement Cluster - Vasavadatta/Rajashree)", "Chittapur (Cement Hub)", "Chincholi", "Aland", "Afzalpur", "Jevargi", "Shahabad (Stone & Cement)"],
      "Kodagu (Madikeri)": ["Madikeri", "Virajpet", "Somwarpet", "Kushalnagar Industrial Area", "Gonikoppal", "Ponnampet"],
      "Kolar": ["Narasapura Industrial Area (Auto Hub)", "Vemagal Industrial Area", "Kolar Gold Fields (KGF)", "Bangarapet", "Malur Industrial Area", "Mulbagal", "Srinivaspur (Mango Capital)"],
      "Koppal": ["Koppal", "Gangavathi (Rice Bowl of Karnataka)", "Kushtagi", "Yelburga", "Karatagi", "Kukanur"],
      "Mandya": ["Mandya (Sugar City)", "Maddur", "Malavalli", "Srirangapatna", "Pandavapura", "Nagamangala", "Krishnarajpet (K.R. Pet)"],
      "Mysuru": ["Hebbal Industrial Area", "Nanjangud Industrial Area (Automotive & Pharma)", "Belagola Industrial Area", "Kadakola Inland Container Depot", "Hunsur", "T. Narasipura", "K.R. Nagar", "Periyapatna (Tobacco Mandi)", "Saragur"],
      "Raichur": ["Raichur (Thermal Power & Cotton)", "Yermarus Industrial Area", "Sindhanur (Paddy Hub)", "Manvi", "Devadurga", "Lingsugur", "Maski", "Sirwar"],
      "Ramanagara": ["Bidadi Industrial Area (Toyota Auto Hub)", "Harohalli Industrial Area", "Ramanagara (Silk City)", "Channapatna (Toy Town)", "Magadi", "Kanakapura"],
      "Shivamogga (Shimoga)": ["Shivamogga Foundry Cluster", "Bhadravati (VISL & MPM Industrial Town)", "Sagar", "Shikaripura", "Soraba", "Tirthahalli", "Hosanagara"],
      "Tumakuru (Tumkur)": ["Vasanthanarasapura Industrial Area (CBIC Node)", "Antharasanahalli Industrial Area", "Tumakuru City", "Tiptur (Copra / Coconut Capital)", "Kunigal Industrial Area", "Sira", "Gubbi", "Pavagada Solar Park", "Madhugiri", "Turuvekere", "Koratagere"],
      "Udupi": ["Udupi", "Manipal", "Kaup", "Kundapura", "Karkala Industrial Area", "Brahmavar", "Byndoor", "Padubidri Industrial & Power Zone", "Hebri"],
      "Uttara Kannada (Karwar)": ["Karwar Port & Naval Base", "Ankola", "Kumta", "Honnavar", "Bhatkal", "Sirsi (Arecanut & Spice Mandi)", "Yellapur", "Dandeli (Paper Mill Town)", "Haliyal (Sugar)", "Joida", "Mundgod"],
      "Vijayanagara": ["Hosapete (Steel & Tourism Hub)", "Hampi", "Kudligi", "Hagaribommanahalli", "Hoovina Hadagali", "Kotturu", "Harapanahalli"],
      "Vijayapura (Bijapur)": ["Vijayapura", "Basavana Bagewadi", "Indi (Horticulture Hub)", "Muddebihal", "Sindagi", "Talikoti", "Chadchan", "Tikota", "Kolhar", "Devar Hippargi"],
      "Yadgir": ["Yadgir Kadechur Industrial Area", "Shahapur", "Shorapur", "Hunsagi", "Gurmitkal", "Wadgera"]
    }
  },

  // ==========================================
  // 12. KERALA (14 Districts)
  // ==========================================
  "Kerala": {
    cities: {
      "Alappuzha": ["Alappuzha (Coir Capital)", "Cherthala Industrial Belt", "Kayamkulam", "Mavelikkara", "Chengannur", "Ambalappuzha", "Haripad", "Kuttanad"],
      "Ernakulam (Kochi)": ["Kochi Port & Vallarpadam ICTT", "Kalamassery KINFRA Hi-Tech Park", "Eloor-Edayar Industrial Zone", "Willingdon Island", "Angamaly Industrial Estate", "Perumbavoor (Plywood Capital)", "Aluva", "Muvattupuzha", "Kothamangalam", "Tripunithura", "Kakknad SmartCity"],
      "Idukki": ["Painavu", "Thodupuzha Commercial Hub", "Munnar (Tea Capital)", "Adimali", "Kumily (Cardamom Spices Hub)", "Kattappana (Spices Market)", "Nedumkandam", "Peermade"],
      "Kannur": ["Kannur (Handloom & Textile City)", "Thalassery", "Payyanur", "Mattannur Airport Zone", "Taliparamba", "Iritty", "Kuthuparamba", "Valapattanam Wood Hub"],
      "Kasaragod": ["Kasaragod", "Kanhangad", "Nileshwar", "Manjeshwar Border Industrial Zone", "Uppala", "Cheruvathur", "Vellarikundu"],
      "Kollam": ["Kollam (Cashew Capital of the World)", "Chavara (KMML Titanium Zone)", "Karunagappally", "Punalur (Paper Town)", "Kottarakkara", "Paravur", "Sasthamkotta", "Kundara Technopark"],
      "Kottayam": ["Kottayam (Natural Rubber Capital)", "Changanassery", "Pala", "Kanjirappally (Rubber Plantations)", "Vaikom", "Ettumanoor", "Erattupetta"],
      "Kozhikode": ["Kozhikode City", "West Hill Industrial Estate", "KINFRA Park Kakkancherry", "Beypore Port", "Feroke (Tile & Timber)", "Vadakara", "Koyilandy", "Ramanattukara", "Mukkam", "Thamarassery"],
      "Malappuram": ["Malappuram", "Manjeri", "Perinthalmanna", "Tirur", "Ponnani Port", "Kottakkal (Arya Vaidya Sala)", "Kondotty Airport Zone", "Nilambur (Teak Town)", "Edappal", "Valanchery"],
      "Palakkad": ["Kanjikode Industrial Area (Kerala's 2nd Largest)", "Palakkad City", "Ottapalam", "Shornur Railway Junction", "Mannarkkad", "Chittur", "Pattambi", "Alathur", "Walayar Industrial Belt"],
      "Pathanamthitta": ["Pathanamthitta", "Tiruvalla Commercial Town", "Adoor", "Ranni", "Konni", "Kozhencherry", "Pandalam"],
      "Thiruvananthapuram": ["Technopark Phases 1-4", "Kochuveli Industrial Area", "Vizhinjam International Deepwater Seaport", "Thiruvananthapuram Capital City", "Neyyattinkara", "Attingal", "Nedumangad", "Varkala", "Kazhakkoottam"],
      "Thrissur": ["Thrissur (Gold & Finance Capital)", "Ollur Industrial Area", "Chalakudy", "Kodungallur Port", "Guruvayur", "Kunnamkulam", "Irinjalakuda", "Wadakkanchery", "Pudukad"],
      "Wayanad": ["Kalpetta", "Sulthan Bathery (Spices & Coffee Hub)", "Mananthavady", "Meppadi", "Vythiri", "Ambalavayal"]
    }
  },

  // ==========================================
  // 13. MADHYA PRADESH (55 Districts)
  // ==========================================
  "Madhya Pradesh": {
    cities: {
      "Agar Malwa": ["Agar", "Susner", "Nalkheda", "Badod"],
      "Alirajpur": ["Alirajpur", "Jobat", "Sondwa", "Bhabra (Chandra Shekhar Azad Nagar)", "Katthiwada"],
      "Anuppur": ["Anuppur", "Amarkantak", "Chachai (Thermal Power)", "Kotma Coal Belt", "Jaithari"],
      "Ashoknagar": ["Ashoknagar", "Chanderi (Handloom Silk Hub)", "Mungeroli", "Isagarh", "Shadora"],
      "Balaghat": ["Balaghat (Manganese Capital - MOIL)", "Malanjkhand (Copper City - HCL)", "Waraseoni", "Katangi", "Baihar", "Lalburra", "Lanji"],
      "Barwani": ["Barwani", "Sendhwa (Cotton & Ginning Hub)", "Anjad", "Pansemal", "Rajpur", "Pati", "Niwali"],
      "Betul": ["Betul", "Sarni (Satpura Thermal Power)", "Multai", "Amla Railway Hub", "Bhainsdehi", "Shahpur", "Chicholi", "Ghodadongri"],
      "Bhind": ["Bhind", "Malanpur Industrial Area", "Banmore", "Gohad", "Mehgaon", "Ater", "Lahar"],
      "Bhopal": ["Govindpura Industrial Area", "Mandideep Industrial Area (Bhopal Border)", "Bhopal City", "Bairagarh", "Kolar", "Berasia", "Huzur", "Bagsewaniya"],
      "Burhanpur": ["Burhanpur (Textile & Banana Hub)", "Nepanagar (Newsprint Mill)", "Kharknar", "Dedtalai"],
      "Chhatarpur": ["Chhatarpur", "Khajuraho", "Nowgong", "Harpalpur Mandi", "Bada Malhera", "Bijawar", "Rajnagar", "Laundi"],
      "Chhindwara": ["Chhindwara Multi-Modal Park", "Borgaon Industrial Area", "Parasia Coal Belt", "Pandhurna (Orange & Cotton Hub)", "Sausar Industrial Area", "Amarwara", "Jamai / Junnardeo", "Tamia", "Harrai", "Chaurai"],
      "Damoh": ["Damoh", "Narsinghgarh (Cement Hub)", "Hatta", "Patharia", "Jabera", "Tendukheda", "Batiyagarh"],
      "Datia": ["Datia", "Seondha", "Bhander", "Indergarh"],
      "Dewas": ["Dewas Industrial Area (Pharma & Bank Note Press)", "Sonkatch", "Bagli", "Kannod", "Khategaon", "Tonk Khurd", "Hatpipliya"],
      "Dhar": ["Pithampur Auto & Pharma SEZ (Detroit of India)", "Dhar City", "Dhamnod", "Manawar", "Badnawar", "Kukshi", "Sardarpur", "Gandhwani"],
      "Dindori": ["Dindori", "Shahpura", "Bajag", "Mehandwani", "Samnapur", "Karanjiya"],
      "Guna": ["Guna", "Raghogarh (GAIL & NFL Complex)", "Chhabra Border", "Aron", "Chachoura-Binaganj", "Kumbhraj", "Bamori"],
      "Gwalior": ["Gwalior City", "Malanpur Industrial Area", "Banmore Industrial Belt", "Dabra (Sugar Mill Hub)", "Bhitarwar", "Morar", "Ghatigaon", "Lashkar"],
      "Harda": ["Harda (Agri & Soybean Mandi)", "Timarni", "Khirkiya", "Handia", "Sirali"],
      "Hoshangabad (Narmadapuram)": ["Narmadapuram", "Itarsi (Railway Hub & Ordnance)", "Pipariya (Grain Mandi & Pachmarhi Base)", "Babai Mohasa Industrial Area", "Seoni Malwa", "Sohagpur", "Bankhedi"],
      "Indore": ["Sanwer Road Industrial Area Phases 1-3", "Palda Industrial Area", "Pithampur SEZ Sector 1-3", "Laxmibai Nagar Industrial Area", "Rau", "Mhow Cantt", "Depalpur", "Hatod", "Manglia Logistics Park", "Vijay Nagar"],
      "Jabalpur": ["Richhai Industrial Area", "Adhartal Industrial Estate", "Khamaria Ordnance Factory", "Sihora (Mineral Hub)", "Patan", "Panagar", "Majholi", "Shahpura", "Barela"],
      "Jhabua": ["Jhabua", "Meghnagar Industrial Area (Chemical Hub)", "Thandla", "Petlawad", "Ranapur", "Rama"],
      "Katni": ["Katni (Limestone & Marble Capital)", "Murwara", "Vijayraghavgarh", "Barhi", "Bahoriband", "Rithi", "Badwara", "Dhimarkheda"],
      "Khandwa (East Nimar)": ["Khandwa (Cotton Hub & Railway Junction)", "Singaji Super Thermal Power Zone", "Pandhana", "Punasa (Indira Sagar Dam)", "Harsud", "Chhaigaon Makhan"],
      "Khargone (West Nimar)": ["Khargone (Cotton & Chilli Hub)", "Nimrani Industrial Area", "Sanawad", "Barwaha", "Bhikangaon", "Kasrawad", "Maheshwar (Handloom Sarees)", "Gogawan"],
      "Maihar": ["Maihar (Cement Capital - Birla/KJS)", "Amarpatan", "Ramnagar"],
      "Mandla": ["Mandla", "Mandla-Fort", "Nainpur Railway Junction", "Bichhiya", "Niwas", "Ghughri"],
      "Mandsaur": ["Mandsaur (Garlic & Opium Hub)", "Daloda", "Sitamau", "Suwasra", "Bhanpura", "Garoth", "Malhargarh", "Piplya Mandi"],
      "Morena": ["Morena (Mustard Oil Capital)", "Banmore Industrial Area", "Joura", "Ambah", "Porsa", "Sabalgarh", "Kailaras"],
      "Narsinghpur": ["Narsinghpur (Sugarcane Capital)", "Gadarwara (NTPC Thermal Power Hub)", "Kareli Mandi", "Gotegaon", "Tendukheda", "Chichli"],
      "Neemuch": ["Neemuch (Opium Processing & Mandi)", "Jawad", "Manasa", "Singoli", "Jiran", "Rampura"],
      "Niwari": ["Niwari", "Orchha Heritage Zone", "Prithvipur", "Tarichar Kalan"],
      "Pandhurna": ["Pandhurna (Orange & Cotton Market)", "Sausar Industrial Area", "Nandanvan"],
      "Panna": ["Panna (Diamond Mines - NMDC)", "Ajaigarh", "Gunnor", "Pawai", "Shahnagar", "Devendranagar", "Amanganj"],
      "Raisen": ["Mandideep Industrial Area (Pharma, HEG Graphite)", "Raisen City", "Bari", "Begamganj", "Gairatganj", "Silwani", "Udaipura", "Obedullaganj"],
      "Rajgarh": ["Rajgarh", "Biaora (Agri Mandi & Junction)", "Sarangpur", "Narsinghgarh", "Khilchipur", "Jeerapur", "Pachore"],
      "Ratlam": ["Ratlam (Gold & Namkeen Hub)", "Jaora (Sugar & Spice Mandi)", "Alot", "Sailana", "Piploda", "Bajna", "Namli"],
      "Rewa": ["Rewa Ultra Mega Solar Park (Gudha)", "Jaypee Cement Plant Zone (Rewa)", "Sirmour", "Mauganj Border", "Teonthar", "Huzur", "Hanumana", "Semariya", "Govindgarh"],
      "Sagar": ["Sagar", "Bina (Bharat Oman Refinery Limited - BORL)", "Banda", "Khurai", "Rahatgarh", "Deori", "Rehli", "Shahgarh", "Garhakota"],
      "Satna": ["Satna (Cement Capital of India - Prism/Birla/ACC)", "Maihar Border", "Nagod", "Amarpatan", "Uchehara", "Rampur Baghelan", "Kothi", "Birsinghpur", "Chitrakoot"],
      "Sehore": ["Sehore", "Budhni (Trident Textile Hub & Railway Coach Factory)", "Ashta (Soybean Mandi)", "Ichhawar", "Nasrullaganj / Bherunda", "Shyampur", "Jawar"],
      "Seoni": ["Seoni", "Barghat", "Lakhnadon", "Keolari", "Ghansore", "Chhapara", "Kurai"],
      "Shahdol": ["Shahdol (Coal & Paper Hub - Orient Paper)", "Burhar", "Sohagpur Coal Belt", "Jaisinghnagar", "Beohari", "Gohparu"],
      "Shajapur": ["Shajapur", "Maksi Industrial Area", "Kalapipal", "Shujalpur Mandi", "Polay Kalan"],
      "Sheopur": ["Sheopur", "Vijaypur", "Karahal", "Badoda", "Beerpur"],
      "Shivpuri": ["Shivpuri", "Pohari", "Karera", "Kolaras", "Pichhore", "Khaniyadhana", "Badarwas"],
      "Sidhi": ["Sidhi", "Churhat", "Rampur Naikin", "Majhauli", "Kusmi", "Sihawal"],
      "Singrauli": ["Singrauli (Energy Capital of India - NTPC/NCL)", "Waidhan", "Jayant Coal Mines", "Nigahi", "Deosar", "Chitrangi", "Mada", "Morwa"],
      "Tikamgarh": ["Tikamgarh", "Baldeogarh", "Jatara", "Palera", "Khargapur", "Mohangarh"],
      "Ujjain": ["Nagziri Industrial Area", "Dewas Road Industrial Estate", "Ujjain City", "Nagda (Grasim / Birla Chemical Hub)", "Mahidpur", "Tarana", "Khachrod", "Badnagar"],
      "Umaria": ["Umaria", "Birsinghpur Pali (Sanjay Gandhi Thermal Power)", "Manpur", "Nowrozabad Coal Belt", "Chandia"],
      "Vidisha": ["Vidisha", "Basoda (Ganj Basoda Stone & Mandi)", "Sironj", "Kurwai", "Lateri", "Shamshabad", "Gulabganj"],
      "Mauganj": ["Mauganj", "Hanumana", "Naigarhi", "Devtalab"]
    }
  },

  // ==========================================
  // 14. MAHARASHTRA (36 Districts)
  // ==========================================
  "Maharashtra": {
    cities: {
      "Ahmednagar": ["MIDC Ahmednagar", "Supo MIDC", "Shrirampur", "Rahuri", "Sangamner", "Kopargaon", "Shirdi", "Rahata", "Nevasa", "Shevgaon", "Pathardi", "Parner", "Shrigonda", "Karjat", "Jamkhed", "Akole"],
      "Akola": ["Akola MIDC", "Murtizapur", "Akot (Cotton Hub)", "Balapur", "Patur", "Telhara", "Barshitakli"],
      "Amravati": ["Amravati MIDC (Textile Park)", "Nandgaon Khandeshwar", "Badnera", "Achalpur / Paratwada", "Morshi (Orange Hub)", "Warud (Orange Hub)", "Chandur Bazar", "Chandur Railway", "Daryapur", "Anjangaon Surji", "Dharni", "Chikhaldara", "Tiosa", "Dhamangaon Railway"],
      "Beed": ["Beed MIDC", "Parli Vaijnath Thermal Power", "Majalgaon", "Georai", "Ambejogai", "Ashti", "Patoda", "Kaij", "Dharur", "Wadwani", "Shirur Kasar"],
      "Bhandara": ["Bhandara MIDC", "Tumsar (Manganese City)", "Pauni", "Sakoli", "Lakhani", "Mohadi", "Lakhandur"],
      "Buldhana": ["Buldhana", "Khamgaon MIDC (Silver & Oil Town)", "Malkapur Industrial Area", "Shegaon", "Chikhli", "Mehkar", "Sindkhed Raja", "Lonar", "Nandura", "Jalgaon Jamod", "Sangrampur", "Deulgaon Raja", "Motala"],
      "Chandrapur": ["Chandrapur Super Thermal Power", "Ballarpur (Paper Mill Capital)", "MIDC Chandrapur", "Tadoba", "Warora", "Bhadravati Coal Belt", "Rajura Cement Cluster", "Mul", "Nagbhid", "Sindewahi", "Brahmapuri", "Korpurna", "Gondpipri", "Pombhurna", "Jiwati"],
      "Chhatrapati Sambhajinagar (Aurangabad)": ["Waluj MIDC (Auto Hub)", "Chikalthana MIDC", "Shendra MIDC (AURIC Smart City)", "Bidkin DMIC", "Paithan MIDC", "Gangapur", "Kannad", "Sillod", "Vaijapur", "Khuldabad", "Soegaon", "Phulambri", "Garkheda", "Cidco", "Beed Bypass", "Padegaon", "Harsul", "Satara Parisar"],
      "Dharashiv (Osmanabad)": ["Osmanabad MIDC", "Tuljapur", "Omerga", "Kalamb", "Bhoom", "Paranda", "Lohara", "Washi"],
      "Dhule": ["Dhule MIDC", "Nardana MIDC (Textile Park)", "Shirpur (Gold Refinery & Textile Hub)", "Sakri Solar Park", "Sindkheda"],
      "Gadchiroli": ["Gadchiroli MIDC", "Chamorshi", "Aheri", "Konsari Steel Plant (Lloyds)", "Armori", "Kurkheda", "Dhanora", "Desaiganj (Wadsa)", "Sironcha", "Bhamragad", "Etapalli", "Korchi", "Mulchera"],
      "Gondia": ["Gondia (Rice City of Maharashtra)", "Tirora Adani Power Plant", "Goregaon", "Amgaon", "Salekasa", "Sadak Arjuni", "Arjuni Morgaon", "Deori"],
      "Hingoli": ["Hingoli MIDC", "Basmath (Turmeric Mandi)", "Kalamnuri", "Sengaon", "Aundha Nagnath"],
      "Jalgaon": ["Jalgaon MIDC (Gold & PVC Hub)", "MIDC Phase 2", "Bhusawal Thermal Power & Railway Junction", "Chalisgaon Textile Hub", "Amalner", "Pachora", "Jamner", "Raver (Banana Capital)", "Yawal", "Chopda", "Erandol", "Parola", "Dharangaon", "Bhadgaon", "Muktainagar", "Bodwad"],
      "Jalna": ["Jalna MIDC (Steel & Seed Capital)", "Partur", "Ambad", "Bhokardan", "Jafrabad", "Ghansawangi", "Badnapur", "Mantha"],
      "Kolhapur": ["Shiroli MIDC", "Gokul Shirgaon MIDC", "Kagal-Hatkanangale Five Star MIDC", "Ichalkaranji (Manchester of Maharashtra)", "Jaysingpur", "Gadhinglaj", "Karveer", "Panhala", "Radhanagari", "Bhudargad", "Ajara", "Chandgad", "Shahuwadi", "Gaganbawda"],
      "Latur": ["Latur MIDC (Soybean Capital)", "Marathwada Rail Coach Factory", "Ausa", "Nilanga", "Udgir", "Ahmedpur", "Chakur", "Renapur", "Deoni", "Shirur Anantpal", "Jalkot"],
      "Mumbai City": ["Nariman Point", "Fort", "Colaba", "Dadar", "Lower Parel", "Byculla", "Worli", "Marine Lines", "Parel", "Malabar Hill"],
      "Mumbai Suburban": ["Andheri MIDC (SEEPZ)", "Bandra-Kurla Complex (BKC)", "Kurla", "Borivali", "Goregaon", "Malad", "Kandivali", "Ghatkopar", "Mulund", "Chembur", "Powai", "Vikhroli", "Dahisar", "Vile Parle", "Santacruz", "Jogeshwari"],
      "Nagpur": ["Butibori MIDC (Asia's Largest Industrial Estate)", "Hingna MIDC", "MIHAN Multi-Modal SEZ", "Kamptee", "Katol (Orange Mandi)", "Kalameshwar MIDC", "Savner", "Ramtek", "Umred", "Narkhed", "Mouda NTPC Zone", "Bhiwapur (Chilli Hub)", "Kuhi", "Parseoni"],
      "Nanded": ["Nanded MIDC", "Kusumtai Chavan MIDC", "Loha", "Degloor", "Mudkhed", "Mukhed", "Kandhar", "Hadgaon", "Kinwat", "Bhokar", "Biloli", "Naigaon", "Dharmabad", "Umri", "Himayatnagar", "Mahoor", "Ardhapur (Banana Mandi)"],
      "Nandurbar": ["Nandurbar MIDC (Chilli Market)", "Navapur", "Shahada (Sugar Hub)", "Taloda", "Akkalkuwa", "Dhadgaon / Akrani"],
      "Nashik": ["Ambad MIDC", "Satpur MIDC", "Sinnar MIDC", "Dindori (Wine Capital)", "Pimpalgaon Baswant (Tomato & Onion Hub)", "Lasalgaon (Asia's Largest Onion Mandi)", "Malegaon (Powerloom Textile Hub)", "Yeola (Paithani Silk Hub)", "Niphad", "Trimbakeshwar", "Igatpuri", "Baglan / Satana", "Kalwan", "Deola", "Chandwad"],
      "Palghar": ["Tarapur MIDC (Chemical & Steel Hub)", "Boisar", "Vasai Industrial Estate", "Virar", "Palghar Taluka", "Dahanu (Chiku Hub & Thermal Power)", "Wada Industrial Area", "Jawhar", "Mokhada", "Talasari", "Vikramgad"],
      "Parbhani": ["Parbhani MIDC", "Gangakhed (Sugar Hub)", "Jintur", "Sailu (Cotton Ginning)", "Pathri", "Manwath", "Purna Railway Junction", "Palam", "Sonpeth"],
      "Pune": ["Chakan MIDC (Automobile Capital)", "Bhosari MIDC", "Pimpri-Chinchwad (PCMC)", "Hinjawadi Rajiv Gandhi Infotech Park", "Hadapsar Industrial Estate", "Talegaon Dabhade MIDC", "Ranjangaon Five Star MIDC", "Kharadi EON Free Zone", "Wagholi", "Baramati MIDC", "Shirur", "Junnar", "Khed", "Maval", "Mulshi", "Haveli", "Daund (Kurkumbh MIDC)", "Indapur", "Purandar", "Bhor", "Velhe", "Pirangut Industrial Area", "Sanaswadi"],
      "Raigad (Alibag / Navi Mumbai)": ["Panvel", "Taloja MIDC (Chemical & Engineering)", "JNPT Nhava Sheva Port SEZ", "Rasayani Patalganga MIDC", "Khopoli Industrial Area", "Mahad MIDC (Pharma Hub)", "Roha MIDC (Chemical Hub)", "Alibag", "Pen (Ganesh Idol Hub)", "Uran CFS Zone", "Karjat", "Mangaon", "Murud", "Shrivardhan", "Tala", "Poladpur", "Mhasla"],
      "Ratnagiri": ["Ratnagiri MIDC (Mirjole)", "Chiplun Kherdi MIDC (Pharma)", "Khed (Lote Parshuram Chemical MIDC)", "Guhagar (LNG Port)", "Dapoli", "Mandangad", "Sangameshwar", "Lanja", "Rajapur (Alphonso Mango Hub)"],
      "Sangli": ["Kupwad MIDC", "Miraj MIDC (Medical Hub)", "Islampur (Walwa Sugar & Auto)", "Tasgaon (Raisins & Grape Capital)", "Vita / Khanapur (Gold Hub)", "Palus Industrial Area", "Kadegaon", "Jath", "Atpadi (Pomegranate Hub)", "Shirala", "Kavathe Mahankal"],
      "Satara": ["Satara MIDC (Cooper & Engineering)", "Karad MIDC", "Phaltan MIDC (Cummins Engine Mega Zone)", "Wai MIDC", "Mahabaleshwar (Strawberry Capital)", "Patan", "Koregaon", "Khatav", "Man / Dahiwadi", "Khandala (Shirwal MIDC)", "Jaoli"],
      "Sindhudurg": ["Kudal MIDC", "Kankavli", "Sawantwadi (Wooden Toy Craft)", "Malvan", "Vengurla", "Devgad (Alphonso Mango Hub)", "Dodamarg", "Vaibhavwadi"],
      "Solapur": ["Solapur MIDC (Terry Towel & Chaddar Hub)", "Chincholi MIDC", "Pandharpur", "Barshi (Dal Mills Hub)", "Akkalkot", "Mohol", "Karmala", "Madha", "Sangola (Pomegranate Capital)", "Malshiras", "Mangalwedha", "South Solapur", "North Solapur"],
      "Thane": ["Thane West Wagle Estate", "Kalyan", "Dombivli MIDC", "Bhiwandi (Asia's Largest Logistics & Warehousing Hub)", "Ulhasnagar", "Ambarnath MIDC", "Badlapur MIDC", "Murbad MIDC", "Shahapur Industrial Zone", "Mira-Bhayandar"],
      "Wardha": ["Wardha MIDC", "Deoli Steel Industrial Growth Centre", "Hinganghat (Cotton & Ginning Hub)", "Arvi", "Sevagram", "Samudrapur", "Seloo", "Karanja Ghadge", "Ashti"],
      "Washim": ["Washim MIDC", "Risod", "Malegaon", "Karanja Lad (Dal & Grain Mandi)", "Mangrulpir", "Manora"],
      "Yavatmal": ["Yavatmal MIDC", "Pusad", "Umarkhed", "Digras", "Darwha", "Wani (Coal & Lime Belt)", "Pandharkawada / Kelapur", "Arni", "Ghatanji", "Ralegaon", "Kalamb", "Babhulgaon", "Mahagaon", "Zari Jamani", "Maregaon", "Ner"]
    }
  },

  // ==========================================
  // 15. MANIPUR (16 Districts)
  // ==========================================
  "Manipur": {
    cities: {
      "Bishnupur": ["Bishnupur", "Moirang", "Ningthoukhong", "Oinam", "Nambol"],
      "Chandel": ["Chandel", "Maha", "Chakpikarong", "Khengjoy"],
      "Churachandpur": ["Churachandpur / Lamka", "Tuibong", "Singngat", "Samulamlan", "Henglep"],
      "Imphal East": ["Porompat", "Heingang", "Lamlai", "Sawombung", "Keirao Bitra"],
      "Imphal West": ["Imphal City", "Lamphelpat", "Lamsang", "Patsoi", "Wangoi", "Sekmai (Food & Brewery)"],
      "Jiribam": ["Jiribam Rail & Trade Terminal", "Borobekra", "Babupara"],
      "Kakching": ["Kakching (Granary of Manipur)", "Waikhong", "Hiyanglam", "Sugnu", "Pallel Trade Gate"],
      "Kamjong": ["Kamjong", "Phungyar", "Kasom Khullen", "Sahamphung"],
      "Kangpokpi": ["Kangpokpi", "Saitu Gamphazol", "Saikul", "Champhai", "Bungte Chiru"],
      "Noney": ["Noney / Longmai", "Nungba", "Haochong", "Khoupum"],
      "Pherzawl": ["Pherzawl", "Thanlon", "Tipaimukh / Parbung", "Vangai"],
      "Senapati": ["Senapati", "Mao Gate (Inter-State Trade)", "Maram", "Paomata", "Purul", "Willong"],
      "Tamenglong": ["Tamenglong", "Tamei", "Tousem", "Khongsang Rail Hub"],
      "Tengnoupal": ["Tengnoupal", "Moreh (International Border Trade Port / ICP)", "Machi"],
      "Thoubal": ["Thoubal", "Lilong", "Wangjing", "Yairipok", "Heirok"],
      "Ukhrul": ["Ukhrul", "Chingai", "Jessami", "Lungchong Maiphei", "Ukhrul Central"]
    }
  },

  // ==========================================
  // 16. MEGHALAYA (12 Districts)
  // ==========================================
  "Meghalaya": {
    cities: {
      "Eastern West Khasi Hills": ["Mairang", "Mawthadraishan"],
      "East Garo Hills": ["Williamnagar", "Samanda", "Songsak", "Rongjeng"],
      "East Jaintia Hills": ["Khliehriat (Cement Cluster)", "Lad Rymbai", "Sutnga", "Saipung", "Lumshnong"],
      "East Khasi Hills (Shillong)": ["Shillong Capital City", "Mawlai", "Pynursla", "Sohra / Cherrapunji", "Mawsynram", "Mawkynrew", "Khatarshnong", "Laitkroh"],
      "North Garo Hills": ["Resubelpara", "Mendipathar (Railway Hub)", "Kharkutta", "Bajengdoba"],
      "Ri-Bhoi": ["Nongpoh", "Byrnihat Industrial Area (Export Growth Centre)", "Umiam Industrial Estate", "Umsning", "Jirang", "Bhoirymbong Airport Zone"],
      "South Garo Hills": ["Baghmara", "Gasuapara Border Trade", "Rongara", "Chokpot", "Siju"],
      "South West Garo Hills": ["Ampati", "Betasing", "Zikzak", "Mahendraganj Border Port"],
      "South West Khasi Hills": ["Mawkyrwat", "Ranikor Border Trade", "Mawthawpdah"],
      "West Garo Hills (Tura)": ["Tura", "Phulbari", "Tikrikilla", "Dalu Border Trade Point", "Selsella", "Rongram", "Dadenggre"],
      "West Jaintia Hills (Jowai)": ["Jowai", "Thadlaskein", "Amlarem", "Dawki (Integrated Border Checkpost)", "Laskein"],
      "West Khasi Hills": ["Nongstoin", "Mawshynrut", "Rambrai", "Shallang Coal Belt"]
    }
  },

  // ==========================================
  // 17. MIZORAM (11 Districts)
  // ==========================================
  "Mizoram": {
    cities: {
      "Aizawl": ["Aizawl Capital City", "Lengpui Airport Zone", "Bawngkawn", "Khatla", "Tuirial", "Darlawn", "Tlangnuam", "Sairang Rail Terminal"],
      "Champhai": ["Champhai (Indo-Myanmar Trade Gateway)", "Zokhawthar Border Trade Point", "Khawbung", "Ngopa"],
      "Hnahthial": ["Hnahthial", "South Vanlaiphai", "Thingsai"],
      "Khawzawl": ["Khawzawl", "Biate", "Rabung"],
      "Kolasib": ["Kolasib", "Vairengte (Inter-State Border Trade)", "Bairabi Industrial / Rail Hub", "Bilkhawthlir", "Thingdawl"],
      "Lawngtlai": ["Lawngtlai", "Chawngte / Kamalanagar", "Sangau", "Bungtlang South", "Vaseitlang"],
      "Lunglei": ["Lunglei", "Tlabung Border Port", "Hnahthial Road", "Bunghmun", "Lungsen"],
      "Mamit": ["Mamit", "Lengpui", "Zawlnuam", "West Phaileng", "Reiek"],
      "Saitual": ["Saitual", "Ngopa", "Keifang"],
      "Serchhip": ["Serchhip", "Thenzawl (Handloom Hub)", "East Lungdar", "Chhingchhip"],
      "Siaha": ["Siaha", "Tipa", "Tuipang", "Phura"]
    }
  },

  // ==========================================
  // 18. NAGALAND (16 Districts)
  // ==========================================
  "Nagaland": {
    cities: {
      "Chümoukedima": ["Chümoukedima", "Medziphema Industrial & Agri Hub", "Seithekema", "Dhansiripar"],
      "Dimapur": ["Dimapur Commercial Capital", "Dimapur Industrial Estate", "Purana Bazar", "Rangapahar", "Naharbari"],
      "Kiphire": ["Kiphire", "Seyochung", "Pungro", "Sitimi"],
      "Kohima": ["Kohima Capital City", "Jakhama", "Chiephobozou", "Tseminyu Border", "Sechü Zubza Railway Hub"],
      "Longleng": ["Longleng", "Tamlu", "Yongnyah", "Sakshi"],
      "Mokokchung": ["Mokokchung Commercial Hub", "Tuli (Paper Mill Zone)", "Changtongya", "Mangkolemba", "Ongpangkong"],
      "Mon": ["Mon", "Tizit Industrial Area", "Naginimora Coal Belt", "Aboi", "Tobu"],
      "Niuland": ["Niuland", "Nihokhu", "Aghunaqa"],
      "Noklak": ["Noklak", "Thonoknyu", "Panso", "Nokhu"],
      "Peren": ["Peren", "Jalukie (Agri Granary)", "Tening", "Ahthibung"],
      "Phek": ["Phek", "Pfütsero (High Altitude Agri Hub)", "Chozuba", "Meluri", "Chizami"],
      "Shamator": ["Shamator", "Chessore", "Tsurungto"],
      "Tseminyu": ["Tseminyu", "Tsogin", "Ghaspani"],
      "Tuensang": ["Tuensang", "Longkhim", "Noksen", "Chare"],
      "Wokha": ["Wokha", "Bhandari Oil Exploration Zone", "Sanis", "Ralan"],
      "Zunheboto": ["Zunheboto", "Aghunato", "Satakha", "Akuluto", "Suruhuto", "Pughoboto"]
    }
  },

  // ==========================================
  // 19. ODISHA (30 Districts)
  // ==========================================
  "Odisha": {
    cities: {
      "Angul": ["Angul City", "NALCO Smelter & Power Complex", "Jindal Steel & Power (JSPL Zone)", "Talcher Coalfields (MCL)", "Banarpal", "Kaniha NTPC Super Thermal", "Chhendipada", "Athamallik", "Pallahara"],
      "Balangir": ["Balangir", "Titilagarh Railway & Grain Hub", "Patnagarh", "Kantabanji (Agri Mandi)", "Saintala Ordnance Factory", "Tushura", "Puintala"],
      "Balasore (Baleshwar)": ["Balasore Industrial Area", "Chandipur (DRDO Missile Range)", "Soro", "Jaleswar Border Checkpost", "Basta", "Remuna", "Nilagiri", "Bahanaga"],
      "Bargarh": ["Bargarh (Rice Bowl of Odisha)", "Bargarh Cement Works (ACC)", "Padampur", "Attabira (Rice Mill Cluster)", "Barpali (Handloom Sambalpuri Sarees)", "Sohela", "Bhatli"],
      "Bhadrak": ["Bhadrak", "Dhamra Deepwater Port SEZ", "Basudevpur", "Chandbali", "Dhamnagar", "Bhandaripokhari", "Tihidi"],
      "Boudh": ["Boudh", "Harbhanga", "Kantamal", "Purunakatak"],
      "Cuttack": ["Jagatpur Industrial Estate", "Choudwar Industrial Complex", "Cuttack City", "Athagarh", "Banki", "Salipur", "Badamba", "Niali", "Tangi-Choudwar"],
      "Deogarh (Debagarh)": ["Deogarh", "Barkote", "Reamal", "Tileibani"],
      "Dhenkanal": ["Dhenkanal", "Meramandali (Tata Steel BSL)", "Kamidhenu / Hindol", "Bhuban", "Gondia", "Kamakhyanagar", "Parjang"],
      "Gajapati (Paralakhemundi)": ["Paralakhemundi", "Kasirangam", "Mohana", "R.Udayagiri", "Kashinagar", "Guma", "Rayagada Block"],
      "Ganjam": ["Berhampur Commercial Capital", "Gopalpur Port & Tata SEZ", "Chhatrapur", "Aska (Sugar & Cotton)", "Hinjilicut", "Bhanjanagar", "Polasara", "Bellaguntha", "Digapahandi", "Ganjam Town (Grasim Chemicals)"],
      "Jagatsinghpur": ["Paradip Mega Port & IOCL Refinery Hub", "IFFCO Fertilizer Complex Paradip", "Jagatsinghpur", "Tirtol", "Kujang", "Erasama", "Balikuda", "Naugaon"],
      "Jajpur": ["Kalinganagar Industrial Complex (Tata / Jindal / Neelachal Steel Hub)", "Jajpur Road (Vyasanagar)", "Jajpur Town", "Dhanmandal", "Sukinda (Chromite Capital of India)", "Chhatia", "Chandikhole Logistics Hub", "Dharmasala", "Bari", "Binjharpur"],
      "Jharsuguda": ["Jharsuguda (Power & Aluminium Capital - Vedanta)", "Brajarajnagar (Paper & Coal)", "Belpahar (Refractories Hub)", "Kolabira", "Laikera", "Kirmira"],
      "Kalahandi (Bhawanipatna)": ["Bhawanipatna", "Lanjigarh (Vedanta Alumina Refinery)", "Kesinga Railway & Mandi Hub", "Junagarh", "Dharamgarh (Paddy Hub)", "Jaipatna", "Mukhiguda Hydro Power"],
      "Kandhamal (Phulbani)": ["Phulbani", "G.Udayagiri (Turmeric Hub)", "Baliguda", "Daringbadi (Kashmir of Odisha)", "Kotagarh", "Tikabali", "Raikia"],
      "Kendrapara": ["Kendrapara", "Pattamundai", "Aul", "Rajnagar (Bhitarkanika Zone)", "Marshaghai", "Derabish", "Garadpur", "Mahakalapada"],
      "Kendujhar (Keonjhar)": ["Keonjhar", "Barbil Iron Ore & Mineral Hub", "Joda Mining Complex", "Anandapur", "Ghatgaon", "Champua", "Telkoi", "Patna", "Harichandanpur"],
      "Khordha (Bhubaneswar)": ["Mancheswar Industrial Estate", "Chandaka Industrial Estate", "Infocity IT SEZ Phases 1-2", "Khordha Industrial Estate", "Jatni Railway Junction", "Bhubaneswar Capital City", "Jayadev Vihar", "Patia", "Janla Logistics Park", "Balipatna", "Banapur", "Balugaon Chilika Hub"],
      "Koraput": ["Jeypore Commercial Hub", "HAL Sunabeda Aero-Engine Division", "NALCO Damanjodi Bauxite Mines & Refinery", "Koraput City", "Kotpad Handloom Hub", "Semiliguda", "Kundura", "Borigumma", "Pottangi"],
      "Malkangiri": ["Malkangiri", "Balimela Hydro Power Zone", "Mathili", "Kalimela", "Chitrakonda", "Motu Border Checkpost"],
      "Mayurbhanj (Baripada)": ["Baripada", "Rairangpur (Iron Ore Belt)", "Karanjia", "Jashipur", "Betnoti", "Udala", "Bahalda", "Badasahi"],
      "Nabarangpur": ["Nabarangpur", "Umerkote (Maize Hub)", "Raighar", "Khatiguda", "Jharigam", "Chandahandi", "Tentulikhunti"],
      "Nayagarh": ["Nayagarh", "Ranpur", "Khandapada", "Daspalla", "Odagaon", "Sarankul", "Bhapur", "Nuagaon"],
      "Nuapada": ["Nuapada", "Khariar", "Khariar Road (Grain & Cotton Mandi)", "Komna", "Sinapali", "Boden"],
      "Puri": ["Puri Holy City", "Pipili (Applique Craft Hub)", "Konark", "Nimapada", "Brahmagiri", "Gop", "Kakatpur", "Satyabadi", "Delang"],
      "Rayagada": ["Rayagada (Paper & Alumina Hub - JK Paper)", "Therubali (IMFA Ferro Alloys)", "Gunupur", "Muniguda", "Bissam Cuttack", "Chandrapur", "Kashipur Bauxite Zone", "Padmapur"],
      "Sambalpur": ["Sambalpur City", "Burla Engineering Hub (Hirakud Dam)", "Hirakud (Hindalco Aluminium Smelter)", "Rengali Industrial Area", "Kuchinda", "Jujomura", "Rairakhol", "Dhankauda", "Maneswar"],
      "Subarnapur (Sonepur)": ["Sonepur (Handloom Silk)", "Birmaharajpur", "Tarbha", "Ullunda", "Dunguripali", "Binika"],
      "Sundargarh": ["Rourkela Steel City (SAIL Rourkela Steel Plant)", "Kalunga Industrial Estate", "Rajgangpur (Dalmia Cement Capital)", "Sundargarh City", "Kansbahal Heavy Engineering", "Birmitrapur (Limestone & Dolomite)", "Bonai", "Koida Mining Belt", "Hemgir Coalfields"]
    }
  },

  // ==========================================
  // 20. PUNJAB (23 Districts)
  // ==========================================
  "Punjab": {
    cities: {
      "Amritsar": ["Amritsar City", "Verka Industrial Area", "Chheharta Industrial Estate", "Attari-Wagah ICP Dry Port", "Majitha", "Ajnala", "Baba Bakala", "Jandiala Guru", "Rayya"],
      "Barnala": ["Barnala (Trident Group Textile Capital)", "Tapa Mandi", "Bhadaur", "Mehal Kalan", "Dhanaula"],
      "Bathinda": ["Bathinda Growth Centre", "Guru Gobind Singh Refinery (HMEL Phulokhari)", "Thermal Plant Zone", "Rampura Phul Mandi", "Talwandi Sabo", "Goniana Mandi", "Maur Mandi", "Bhucho Mandi", "Sangat Mandi"],
      "Faridkot": ["Faridkot", "Kotkapura (Asia's Cotton Ginning Hub)", "Jaitu Mandi", "Sadiq"],
      "Fatehgarh Sahib": ["Mandi Gobindgarh (Steel Town of India)", "Sirhind Industrial Area", "Khamanon", "Amloh", "Bassi Pathana"],
      "Fazilka": ["Fazilka", "Abohar (Kinnu & Cotton Capital)", "Jalalabad (Rice Mill Hub)", "Khuian Sarwar", "Arniwala"],
      "Firozpur": ["Firozpur Cantt", "Firozpur City", "Zira (Liquor & Grain)", "Guru Har Sahai", "Mamdot", "Makhu"],
      "Gurdaspur": ["Gurdaspur", "Batala (Foundry & Machine Tools Capital)", "Dera Baba Nanak (Kartarpur Corridor)", "Dhariwal (Woolen Mills)", "Dina Nagar", "Qadian", "Fatehgarh Churian", "Sri Hargobindpur"],
      "Hoshiarpur": ["Hoshiarpur (Century Ply / Sonalika Tractors Hub)", "Dasuya Industrial Area", "Mukerian (Sugar Mills)", "Garhshankar", "Tanda Urmar", "Mahilpur", "Talwara"],
      "Jalandhar": ["Jalandhar Sports Goods & Leather Complex", "Focal Point Jalandhar", "Nakodar", "Phillaur", "Goraya (Agricultural Implements Hub)", "Shahkot", "Kartarpur (Furniture Hub)", "Adampur Airport Zone", "Bhogpur"],
      "Kapurthala": ["Kapurthala (Rail Coach Factory - RCF)", "Phagwara (Auto Components - JCT Mills)", "Sultanpur Lodhi", "Bholath", "Dhilwan"],
      "Ludhiana": ["Focal Point Phases 1-8", "Industrial Area A & B", "Sahnewal Dry Port", "Doraha", "Khanna (Asia's Largest Grain Mandi)", "Jagraon Mandi", "Samrala", "Raikot", "Mullanpur Dakha", "Payal", "Machhiwara"],
      "Malerkotla": ["Malerkotla (Vegetable & Iron Hub)", "Ahmedgarh Mandi", "Amargarh"],
      "Mansa": ["Mansa (White Gold Cotton Belt)", "Budhlada Mandi", "Bareta", "Bhikhi", "Jhunir", "Sardulgarh"],
      "Moga": ["Moga (Nestlé India Food Processing Hub)", "Baghapurana Mandi", "Nihal Singh Wala", "Dharamkot", "Badhni Kalan"],
      "Pathankot": ["Pathankot Defence & Trade Hub", "Sujanpur", "Malikpur", "Narot Jaimal Singh", "Dhar Kalan"],
      "Patiala": ["Patiala City", "Rajpura Industrial & Logistics Hub", "Nabha (Combines & Dairy Hub)", "Samana (Grain Mandi)", "Patran", "Sanaur", "Ghanour", "Shutrana"],
      "Rupnagar (Ropar)": ["Rupnagar", "Nangal (NFL Fertilizer & National Heavy Water)", "Anandpur Sahib", "Chamkaur Sahib", "Morinda (Sugar Mill Zone)", "Nurpur Bedi"],
      "Sahibzada Ajit Singh Nagar (Mohali)": ["Mohali Phase 1-9 Industrial Area", "Sector 82 JLPL Industrial Park", "IT City Mohali", "Derabassi Industrial Belt (Pharma & Steel)", "Lalru Industrial Area", "Kharar", "Kurali", "Zirakpur Logistics Zone", "Banur Industrial Corridor"],
      "Sangrur": ["Sangrur", "Sunam Mandi", "Dhuri (Sugar Mill & Food Processing)", "Lehragaga", "Moonak", "Dirba", "Bhawanigarh"],
      "Shahid Bhagat Singh Nagar (Nawanshahr)": ["Nawanshahr", "Banga", "Balachaur", "Rahon", "Jadla", "Kathgarh"],
      "Sri Muktsar Sahib": ["Sri Muktsar Sahib", "Malout (Cotton & Textile Hub)", "Gidderbaha", "Bariwala", "Lambi"],
      "Tarn Taran": ["Tarn Taran Sahib", "Patti Mandi", "Khadur Sahib", "Goindwal Sahib Industrial Complex", "Bhikhiwind", "Khemkaran Border"]
    }
  },

  // ==========================================
  // 21. RAJASTHAN (50 Districts)
  // ==========================================
  "Rajasthan": {
    cities: {
      "Ajmer": ["Ajmer City", "Kishangarh (Marble Capital of India)", "Beawar (Mineral & Cement Hub)", "Nasirabad Cantt", "Kekri Border", "Pushkar", "Sarwar", "Bijainagar"],
      "Alwar": ["Bhiwadi Industrial Area", "Neemrana Japanese Industrial Zone", "Khushkhera Industrial Area", "Tapukara (Honda Auto Cluster)", "Matsya Industrial Area (MIA Alwar)", "Behror", "Tijara", "Kishangarh Bas", "Shahjahanpur Border", "Ramgarh", "Laxmangarh", "Rajgarh"],
      "Anupgarh": ["Anupgarh", "Gharsana Mandi", "Rawatsar", "Ramsinghpur", "Raisinghnagar", "Suratgarh Border", "Vijaynagar"],
      "Balotra": ["Balotra (Textile Dyeing & Printing Hub)", "Pachpadra (HPCL Rajasthan Refinery Mega Project)", "Siwana", "Samdari", "Jasol", "Kalyanpur", "Baytu Border"],
      "Banswara": ["Banswara (Textile & Power Hub)", "Kushalgarh", "Ghatol", "Garhi", "Bagidora", "Chhoti Sarwan", "Sajjangarh"],
      "Baran": ["Baran", "Chhabra Super Thermal Power", "Kawai Adani Power Plant", "Anta Gas Power", "Atru", "Mangrol", "Kishanganj", "Shahbad"],
      "Barmer": ["Barmer Oil & Gas Basin (Cairn India)", "Uttarlai", "Gudamalani", "Chohtan", "Sheo", "Sindhari", "Sedwa", "Dhorimanna"],
      "Beawar": ["Beawar (Shree Cement Capital)", "Jaitaran", "Raipur Marwar", "Masuda", "Badnor", "Todgarh"],
      "Bharatpur": ["Bharatpur Industrial Area", "Bayana (Stone Hub)", "Deeg Border", "Kaman", "Nadbai (Mustard Mandi)", "Weir", "Rupbas", "Kumher", "Nagar", "Kherli"],
      "Bhilwara": ["Bhilwara (Textile Capital of India)", "Hamirgarh Industrial Area", "Mandal", "Gulabpura Spinning Mills", "Asind", "Shahpura Border", "Bijolia (Sandstone Mining)", "Jahazpur", "Kotri", "Hurda", "Banera"],
      "Bikaner": ["Bikaner City (Namkeen & Wool Hub)", "Karni Industrial Area", "Khara Industrial Area", "Nokha (Moth & Agri Mandi)", "Lunkaransar (Peanut Hub)", "Dungargarh", "Kolayat (Clay Mining)", "Khajuwala", "Chhatargarh", "Pugal Solar Zone"],
      "Bundi": ["Bundi (Rice Mill Hub)", "Keshoraipatan", "Lakheri (ACC Cement - Oldest in India)", "Nainwa", "Hindoli", "Indergarh", "Talera"],
      "Chittorgarh": ["Chittorgarh (Birla / Wonder / JK Cement Hub)", "Chanderiya Lead-Zinc Smelter (HZL)", "Nimbahera (Cement Capital)", "Rawatbhata (Atomic Power Station)", "Kapasan", "Begun", "Bari Sadri", "Rashmi", "Bhadesar"],
      "Churu": ["Churu", "Ratangarh", "Sujangarh", "Sardarshahar", "Rajgarh / Sadulpur", "Taranagar", "Bidasar"],
      "Deeg": ["Deeg", "Kaman", "Nagar", "Kumher", "Jurhara", "Pahari"],
      "Didwana-Kuchaman": ["Didwana (Salt & Mineral Hub)", "Kuchaman City (Mega Education & Marble)", "Makrana (World Famous White Marble)", "Nawa (Salt Mandi)", "Parbatsar", "Ladnun", "Moulani"],
      "Dausa": ["Dausa", "Bandikui Railway Hub", "Lalsot", "Mahwa", "Sikrai", "Mandawar", "Rahuwas"],
      "Dholpur": ["Dholpur (Red Sandstone Capital)", "Bari", "Rajakhera", "Baseri", "Sarmathura", "Saipau"],
      "Dungarpur": ["Dungarpur (Green Marble)", "Sagwara", "Aspur", "Simalwara", "Bichhiwara Industrial Area", "Dovda", "Galiakot"],
      "Ganganagar (Sri Ganganagar)": ["Sri Ganganagar (Food Basket of Rajasthan)", "Suratgarh Super Thermal Power", "Sadulshahar", "Karanpur", "Padampur", "Gajsinghpur", "Anoopgarh Border"],
      "Gangapur City": ["Gangapur City Railway Hub", "Wazirpur", "Bamanwas", "Toda Bhim", "Sapotra"],
      "Hanumangarh": ["Hanumangarh Industrial Area", "Pilibanga", "Nohar (Grain Mandi)", "Bhadra", "Rawatsar", "Sangaria", "Tibbi"],
      "Jaipur": ["Sitapura Industrial Area & Gems/Jewellery SEZ", "Vishwakarma Industrial Area (VKI)", "Mansarovar RIICO", "Bagru Industrial Area (Handblock Prints)", "Bindayaka Industrial Area", "22 Godam Industrial Area", "Jhotwara Industrial Area", "Kanota", "Kukas Auto Hub", "Chomu", "Sanganer (Paper & Textile)", "Bassi", "Chaksu"],
      "Jaipur Gramin": ["Bagru", "Chomu", "Shahpura", "Kotputli Border", "Jamwa Ramgarh", "Phulera", "Sambhar Lake Salt Hub", "Jobner Agri Hub", "Amer", "Govindgarh", "Kishangarh Renwal"],
      "Jaisalmer": ["Jaisalmer (Yellow Marble & Wind Energy)", "Pokhran", "Ramgarh Gas Power", "Mohangarh", "Fatehgarh Solar Hub", "Bhikodai", "Nachna"],
      "Jalore": ["Jalore (Granite City of India)", "Bhinmal", "Sanchore Border", "Ahore", "Sayla", "Jaswantpura", "Bagra Industrial Area"],
      "Jhalawar": ["Jhalawar (Orange City)", "Jhalrapatan", "Bhawani Mandi (Textile & Opium)", "Pirawa", "Aklera", "Manohar Thana", "Khanpur", "Sunel"],
      "Jhunjhunu": ["Jhunjhunu", "Khetri Copper Complex (HCL)", "Nawalgarh (Cement Hub)", "Chirawa", "Pilani (BITS Tech Zone)", "Surajgarh", "Buhana", "Gudha Gorji", "Udaipurwati"],
      "Jodhpur": ["Basni Industrial Area Phases 1-2", "Boronada Industrial Park & SEZ", "Mandore Industrial Area", "Sangaria Industrial Estate", "Pal Industrial Area", "MIA Heavy Industrial Area", "Jodhpur City (Handicrafts Capital)", "Kudi Bhagtasni"],
      "Jodhpur Gramin": ["Luni", "Bilara", "Osian", "Phalodi Border", "Bhopalgarh", "Balesar (Sandstone Mining)", "Piparcity", "Shergarh", "Baori", "Tiwari", "Dhanari"],
      "Karauli": ["Karauli (Red Stone)", "Hindaun City (Stone & Slate Hub)", "Todabhim", "Sapotra", "Mandrail", "Nadoti", "Masalpur"],
      "Kekri": ["Kekri (Agri Mandi)", "Sarwar", "Todaraisingh", "Sawariya", "Bhinai"],
      "Khairthal-Tijara": ["Bhiwadi Industrial Cluster", "Khushkhera", "Tijara", "Tapukara", "Khairthal Grain Mandi", "Kishangarh Bas", "Kotkasim", "Mundawar"],
      "Kota": ["Indraprastha Industrial Area (IPIA)", "Ranpur Industrial Area", "Anantpura Industrial Estate", "DCM Kota", "Kota Super Thermal Power", "CFCL Gadepan Fertilizer Mega Plant", "KSTP Power", "Ramganj Mandi (Kota Stone Capital)", "Sangod", "Digod", "Pipalda", "Itawa Mandi"],
      "Kotputli-Behror": ["Neemrana Japanese Zone", "Behror RIICO", "Kotputli (Grasim / UltraTech Cement)", "Bansur", "Paota", "Viratnagar", "Mandhan", "Narayanpur"],
      "Nagaur": ["Nagaur (Methi / Fenugreek Capital)", "Merta City (Meera Nagari & Mandi)", "Jayal", "Degana (Tungsten & Lithium Zone)", "Ladnun", "Riyan Badi", "Khinvsar", "Mundwa (Ambuja Cement Mega Plant)"],
      "Neem Ka Thana": ["Neem Ka Thana (Mineral & Cement)", "Khetri Copper Belt", "Srimadhopur Mandi", "Udaipurwati", "Patan", "Ringas Industrial Area"],
      "Pali": ["Pali (Cotton & Synthetic Fabric Dyeing Hub)", "Punayata Industrial Area", "Mandia Road Industrial Area", "Marwar Junction", "Sumerpur (Jawaj Bandh / Ghee Mandi)", "Sojat (Henna / Mehendi Capital of the World)", "Rani Industrial Area", "Bali", "Falna (Umbrella City)", "Desuri", "Rohat"],
      "Phalodi": ["Phalodi (Solar Capital of India - Bhadla Solar Park)", "Bap (Salt & Gypsum)", "Lohi Solar Zone", "Aau", "Dechu", "Baap", "Ghantiyali"],
      "Pratapgarh": ["Pratapgarh (Thewa Gold Craft & Garlic)", "Chhoti Sadri", "Dhariawad", "Arnod", "Peepalkhoont"],
      "Rajsamand": ["Rajsamand (Marble & Granite Capital)", "Rajnagar", "Kankroli (JK Tyre Factory)", "Nathdwara", "Dariba Zinc Mines (HZL)", "Amet (Marble Slabs)", "Kumbhalgarh", "Bhim", "Deogarh", "Railmagra"],
      "Salumbar": ["Salumbar", "Sarada", "Semari", "Kherwara Border", "Dhariawad Border", "Jhadol Border"],
      "Sanchore": ["Sanchore (Cattle & Pomegranate Hub)", "Raniwara (Amul Dairy Plant)", "Bagoda", "Chitalwana"],
      "Sawai Madhopur": ["Sawai Madhopur", "Ranthambore", "Gangapur Border", "Bonli", "Bamanwas", "Khandar", "Chauth Ka Barwara", "Malarna Doongar"],
      "Shahpura": ["Shahpura (Phad Painting & Khadi)", "Jahazpur", "Kotri", " जहाजपुर", "Banera", "Hurda Gulabpura"],
      "Sikar": ["Sikar City", "Reengus Industrial Area", "Srimadhopur", "Fatehpur Shekhawati", "Laxmangarh", "Danta Ramgarh", "Khandela", "Nechwa", "Khatu Shyamji"],
      "Sirohi": ["Abu Road Industrial Area (Ambaji Border)", "Mount Abu", "Sirohi City", "Sheoganj Mandi", "Pindwara (JK Cement / Binani Cement)", "Reodar"],
      "Tonk": ["Tonk (Nawabi City & Leather)", "Niwai Industrial Area (Mustard Oil & Dal)", "Deoli (Agri Mandi)", "Malpura", "Todaraisingh", "Uniara", "Peeplu"],
      "Udaipur": ["Sukher Marble Industrial Area", "Mewar Industrial Area (Madri)", "Gudli Industrial Area", "Kalladwas Industrial Estate", "Bedla", "Debari Zinc Smelter (HZL)", "Udaipur City (Mineral & Tourism Capital)", "Fatehnagar", "Mavli", "Vallabhnagar", "Salumber Border", "Kherwara", "Jhadol", "Gogunda", "Rishabhdeo (Green Marble Hub)"]
    }
  },

  // ==========================================
  // 22. SIKKIM (6 Districts)
  // ==========================================
  "Sikkim": {
    cities: {
      "Gangtok": ["Gangtok Capital City", "Tadong Industrial Area", "Ranipool Pharma Hub", "Singtam Commercial Hub", "Deorali", "Burtuk", "Nandok"],
      "Gyalsing (West Sikkim)": ["Gyalsing / Geyzing", "Pelling Tourism Zone", "Yuksom", "Dentam", "Tashiding", "Hee Bermiok"],
      "Pakyong": ["Pakyong Green Airport Zone", "Rangpo (Pharmaceutical & Industrial Hub)", "Rorathang", "Duga", "Rhenock Border Port", "Machong"],
      "Namchi (South Sikkim)": ["Namchi", "Jorethang Industrial Hub", "Melli (Brewery & Distilleries)", "Ravangla", "Sikip", "Yangang", "Temi (Tea Estate)"],
      "Mangan (North Sikkim)": ["Mangan", "Chungthang Hydro Power Hub", "Lachen", "Lachung", "Dzongu", "Kabi Tingda", "Singhik"],
      "Soreng": ["Soreng", "Chumbong", "Daramdin", "Kaluk", "Rinchenpong", "Mangalbaria"]
    }
  },

  // ==========================================
  // 23. TAMIL NADU (38 Districts)
  // ==========================================
  "Tamil Nadu": {
    cities: {
      "Ariyalur": ["Ariyalur (Cement Capital of TN - Ramco/UltraTech)", "Sendurai", "Udayarpalayam", "Jayankondam (Lignite Belt)", "Andimadam"],
      "Chengalpattu": ["Mahindra World City SEZ", "Maraimalai Nagar Industrial Estate (Ford Auto)", "Sriperumbudur Border", "Chengalpattu", "Tambaram South", "Maduranthakam", "Tiruporur", "Kelambakkam OMR IT Corridor", "Mamallapuram"],
      "Chennai": ["Ambattur Industrial Estate (Asia's Largest SME Hub)", "Guindy Industrial Estate", "Ennore Port Zone", "Manali Petrochemical Complex", "Tiruvottiyur", "Poonamallee", "Tidel Park / OMR IT Corridor", "T.Nagar", "Parrys", "Madhavaram Truck Terminal"],
      "Coimbatore": ["SIDCO Industrial Estate Kurichi", "Peelamedu", "Ganapathy Pump & Motor Cluster", "Saravanampatti IT Corridor", "Eachanari", "Malumichampatti", "Pollachi (Coconut & Coir Capital)", "Sulur", "Mettupalayam", "Annur", "Kinathukadavu", "Thudiyalur"],
      "Cuddalore": ["SIPCOT Industrial Complex Cuddalore (Chemicals)", "Neyveli Lignite Corporation (NLCIL Power)", "Panruti (Cashew & Jackfruit Hub)", "Chidambaram", "Vridhachalam (Ceramics)", "Kurinjipadi", "Tittakudi", "Kattumannarkoil"],
      "Dharmapuri": ["Dharmapuri", "Harur", "Palacode (Sugar & Mango Processing)", "Pennagaram (Hogenakkal)", "Karimangalam", "Nallampalli", "Pappireddipatti"],
      "Dindigul": ["Dindigul (Lock & Leather Hub)", "Palani", "Oddanchatram (Asia's Vegetable Mandi)", "Kodaikanal", "Natham", "Nilakottai (Flower & Perfume Market)", "Vedasandur", "Gujiliamparai"],
      "Erode": ["Perundurai SIPCOT Mega Industrial Park", "Ingur", "Erode Turmeric & Textile Market", "Bhavani (Carpet Hub)", "Gobichettipalayam", "Sathyamangalam", "Anthiyur", "Modakkurichi", "Kodumudi", "Chithode"],
      "Kallakurichi": ["Kallakurichi", "Ulundurpet Industrial Area", "Sankarapuram", "Chinnasalem (Rice Mill Hub)", "Tirukoilur", "Kalvarayan Hills", "Rishivandiyam"],
      "Kanchipuram": ["Kanchipuram Silk Sarees Capital", "Sriperumbudur SIPCOT (Hyundai / Samsung Mega Hub)", "Oragadam Industrial Corridor (Renault-Nissan / Daimler Auto)", "Vallam Vadagal SIPCOT", "Irungattukottai SIPCOT", "Walajabad", "Uthiramerur", "Kundrathur"],
      "Kanniyakumari (Nagercoil)": ["Nagercoil", "Kanyakumari", "Marthandam (Honey & Cashew)", "Padmanabhapuram", "Colachel Port", "Thuckalay", "Killiyoor", "Vilavancode"],
      "Karur": ["Karur (Textile Export Capital / Home Textiles)", "TNPL Pugalur (Paper Mill Giant)", "Aravakurichi", "Kulithalai", "Krishnarayapuram", "Kadavur", "Manmangalam"],
      "Krishnagiri": ["Hosur SIPCOT Industrial Complex 1-3 (Auto & EV Hub - TVS/Tata/Ola)", "Bargur SIPCOT", "Krishnagiri (Mango Processing Hub)", "Pochampalli SIPCOT", "Denkanikottai", "Shoolagiri", "Uthangarai", "Kelamangalam"],
      "Madurai": ["Kappalur Industrial Estate", "Urilangan", "Madurai City", "Melur (Granite)", "Vadipatti", "Usilampatti", "Tirumangalam", "Sholavandan", "Thiruparankundram"],
      "Mayiladuthurai": ["Mayiladuthurai", "Sirkazhi", "Tharangambadi (Tranquebar Port)", "Kuthalam"],
      "Nagapattinam": ["Nagapattinam Port", "Velankanni", "Vedaranyam (Salt Hub)", "Kilvelur", "Thirukuvalai"],
      "Namakkal": ["Namakkal (Egg City & Transport Hub)", "Tiruchengode (Rig & Textile Hub)", "Rasipuram (Ghee & Sago)", "Paramathi Velur", "Komarapalayam (Textile Processing)", "Sendamangalam", "Kolli Hills"],
      "Nilgiris (Udhagamandalam / Ooty)": ["Ooty (Tea & Horticulture)", "Coonoor (Tea Auction Centre)", "Kotagiri", "Gudalur (Spices)", "Wellington Cantt", "Aruvankadu (Cordite Factory)"],
      "Perambalur": ["Perambalur SIPCOT", "Veppanthattai", "Kunnam", "Alathur Sugar & Agri Hub"],
      "Pudukkottai": ["Pudukkottai SIPCOT", "Viralimalai Industrial Estate", "Aranthangi", "Alangudi", "Gandarvakottai", "Iluppur", "Thirumayam", "Avudayarkoil", "Manamelkudi"],
      "Ramanathapuram": ["Ramanathapuram", "Rameswaram", "Paramakudi", "Kilakarai", "Mudukulathur", "Tiruvadanai", "Kamuthi (Adani Solar Park)", "Kadaladi", "Mandapam Marine Zone"],
      "Ranipet": ["Ranipet SIPCOT (Leather & Chemical Hub)", "SIPCOT Phase 2", "Arakkonam Railway & MRF Tyre Hub", "Walajah", "Arcot", "Nemili", "Sholinghur"],
      "Salem": ["Salem Steel Plant (SAIL)", "SIDCO Industrial Estate Kandampatty", "Attur (Sago & Tapioca Capital)", "Mettur Industrial Area (Chemicals & Dam)", "Omalur", "Sankari (Cement & Transport)", "Edappadi", "Yercaud", "Magudanchavadi", "Veerapandi"],
      "Sivaganga": ["Sivaganga", "Karaikudi (Chettinad Heritage & CECRI Tech)", "Devakottai", "Manamadurai Industrial Area (SIPCOT)", "Tirupathur", "Ilayangudi", "Kalayarkoil", "Singampunari"],
      "Tenkasi": ["Tenkasi", "Sankarankovil (Textiles)", "Kadayanallur", "Shenkottai Border Port", "Alangulam", "Pavoorchatram", "Surandai", "Thiruvengadam"],
      "Thanjavur": ["Thanjavur (Rice Bowl of TN)", "Kumbakonam (Brassware & Betel)", "Papanasam", "Pattukkottai (Coconut Hub)", "Peravurani", "Orathanadu", "Thiruvaiyaru", "Budalur"],
      "Theni": ["Theni (Cardamom & Cotton Mandi)", "Periyakulam", "Bodinayakanur (Cardamom Capital of India)", "Uthamapalayam", "Cumbum (Grape Valley)", "Chinnamanur", "Andipatti"],
      "Thoothukudi (Tuticorin)": ["VOC Deepwater Port Zone", "SIPCOT Industrial Complex Tuticorin", "Sterlite / SPIC Chemical Complex", "Kovilpatti (Safety Matches & Peanut Candy)", "Tiruchendur", "Ettayapuram", "Srivaikuntam", "Ottapidaram", "Vilathikulam", "Sathankulam", "Kayathar Wind Power Hub"],
      "Tiruchirappalli (Trichy)": ["BHEL Heavy Engineering Zone", "Thuvakudi Industrial Estate", "Trichy City", "Ariyamangalam", "Manapparai SIPCOT (Murukku Hub)", "Srirangam", "Lalgudi", "Musiri", "Thuraiyur", "Tiruverumbur"],
      "Tirunelveli": ["Gangaikondan SIPCOT Mega Tech & Solar Park", "Tirunelveli City", "Palayamkottai", "Ambasamudram (Paper Mill Zone)", "Cheranmahadevi", "Nanguneri Tech SEZ", "Radhapuram (Kudankulam Nuclear Power)", "Thisayanvilai"],
      "Tirupathur": ["Ambur (Leather Shoe & Tannery Capital)", "Vaniyambadi (Leather Hub)", "Tirupathur", "Natrampalli", "Jolarpet Railway Junction", "Yelagiri Hills"],
      "Tiruppur": ["Tiruppur Knitwear & Garment Capital of India", "Tiruppur Apparel Park (Netaji)", "Veerapandi", "Avinashi Industrial Belt", "Palladam Hi-Tech Weaving Park", "Uthukuli (Butter & Ghee)", "Kangeyam (Coconut Oil & Desiccated Powder)", "Dharapuram", "Madathukulam", "Udumalaipettai (Windmills & Poultry)"],
      "Tiruvallur": ["Gummidipoondi SIPCOT 1-2", "Sri City Border Industrial Zone", "Tiruvallur", "Ennore Port Satellite Area", "Minjur Desalination Zone", "Ponneri Smart City", "Avadi Heavy Vehicles Factory", "Ambattur Border", "Pattabiram", "Tiruttani"],
      "Tiruvannamalai": ["Tiruvannamalai", "Cheyyar SIPCOT Mega Industrial Park (Shoe / Footwear Hub)", "Arni (Silk & Rice Mill Capital)", "Polur", "Chengam", "Vandavasi", "Kilpennathur", "Chetpet"],
      "Tiruvarur": ["Tiruvarur", "Mannargudi (Coal Bed & Agri)", "Thiruthuraipoondi", "Kudavasal", "Valangaiman", "Nannilam", "Needamangalam"],
      "Vellore": ["Vellore City", "Katpadi Railway Hub", "Gudiyatham (Safety Matches & Handloom)", "Anaicut", "Kaniyambadi", "Pernambut Leather Zone"],
      "Viluppuram": ["Viluppuram", "Tindivanam SIPCOT Mega Food Park", "Gingee", "Vanur Industrial Area", "Marakkanam Salt Hub", "Vikravandi", "Kandachipuram"],
      "Virudhunagar": ["Sivakasi (Printing, Fireworks & Matches Capital)", "Virudhunagar (Oil & Grain Mandi)", "Rajapalayam (Surgical Cotton & Textile Mills)", "Aruppukkottai (Weaving Hub)", "Sattur", "Srivilliputhur (Milk Peda Hub)", "Watrap", "Kariapatti"]
    }
  },

  // ==========================================
  // 24. TELANGANA (33 Districts)
  // ==========================================
  "Telangana": {
    cities: {
      "Adilabad": ["Adilabad (Cotton Ginning Hub)", "Bela", "Boath", "Utnoor", "Jainath", "Gudihathnoor", "Indervelly", "Tamsi"],
      "Bhadradri Kothagudem": ["Kothagudem (Singareni Collieries SCCL HQ)", "Paloncha (Kothagudem Thermal Power KTPS)", "Manuguru Heavy Water Plant", "Bhadrachalam (ITC Paperboards Zone)", "Yellandu Coal Belt", "Aswapuram", "Burgampahad"],
      "Hanamkonda": ["Hanamkonda", "Kazipet Railway Hub", "Hasanparthy", "Kamalapur", "Elkathurthy", "Bheemadevarpalle", "Dharmasagar"],
      "Hyderabad": ["Jeedimetla Industrial Area", "Sanathnagar Industrial Estate", "Cherlapally Industrial Park", "Balanagar Industrial Estate", "Nacharam Industrial Area", "Mallapur", "Chandulal Baradari", "Azamabad", "Kothur Industrial Corridor", "Gachibowli Financial District", "Madhapur IT Hub", "HITEC City", "Kukatpally", "Begumpet", "Secunderabad Commercial Zone", "Charminar Wholesale Markets", "Begum Bazar Dry Fruits Mandi"],
      "Jagtial": ["Jagtial", "Korutla", "Metpalli", "Raikal", "Dharmapuri", "Medipalli", "Gollapalli"],
      "Jangaon": ["Jangaon", "Station Ghanpur", "Palakurthy", "Bachannapet", "Zaffergadh", "Devaruppula"],
      "Jayashankar Bhupalpally": ["Bhupalpally (Kakatiya Thermal Power & SCCL)", "Regonda", "Chityal", "Kataram", "Mahadevpur", "Malharrao"],
      "Jogulamba Gadwal": ["Gadwal (Handloom Silk Sarees)", "Alampur", "Ieeja", "Itikyal", "Maldakal", "Dharoor"],
      "Kamareddy": ["Kamareddy", "Banswada", "Yellareddy", "Bhiknoor", "Domakonda", "Machareddy", "Gandhari"],
      "Karimnagar": ["Karimnagar (Granite Capital)", "Ramagundam NTPC Power & RFCL Fertilizer", "Huzurabad", "Jammikunta (Cotton Mandi)", "Choppadandi", "Manakondur", "Gangadhara", "Timmapur"],
      "Khammam": ["Khammam Commercial Capital", "Madhira", "Sathupalli Coal Mines", "Wyra", "Kalluru", "Kusumanchi", "Tirumalayapalem"],
      "Kumuram Bheem Asifabad": ["Asifabad", "Kagaznagar (Sirpur Paper Mills)", "Rebbena", "Tiryani", "Kerameri", "Jainoor", "Wankidi"],
      "Mahabubabad": ["Mahabubabad", "Dornakal Railway Hub", "Kesamudram", "Maripeda", "Thorrur", "Kuravi", "Garla"],
      "Mahabubnagar": ["Mahabubnagar (Palamoor)", "Jadcherla Green Industrial Park (SEZ)", "Balanagar", "Bhoothpur", "Devarkadra", "Nawabpet", "Midjil"],
      "Mancherial": ["Mancherial", "Bellampalli Coal Belt", "Mandamarri", "Kyathanpalli", "Chennur", "Luxettipet", "Nennal", "Jaipur Singareni Thermal Power"],
      "Medak": ["Medak", "Haveli Ghanpur", "Narsapur Industrial Area", "Ramayampet", "Shankarampet", "Alladurg", "Chegunta"],
      "Medchal-Malkajgiri": ["Cherlapally Phase 1-5", "Mallapur Industrial Area", "Uppal Industrial Estate", "Moula Ali Industrial Area", "Balanagar Industrial Corridor", "Medchal Industrial Area", "Kompally Logistics Zone", "Gundlapochampally Apparel Park", "Kushaiguda", "Quthbullapur", "Alwal"],
      "Mulugu": ["Mulugu", "Eturnagaram", "Venkatapur", "Govindaraopet", "Tadvai", "Mangapet"],
      "Nagarkurnool": ["Nagarkurnool", "Achampet", "Kalwakurthy", "Kollapur", "Amrabad", "Telkapally", "Bijinapally"],
      "Nalgonda": ["Nalgonda", "Miryalaguda (Rice Mill Capital)", "Devarakonda", "Narketpally Industrial Area", "Nakrekal", "Chityal", "Halim Nagar / Haliya"],
      "Narayanpet": ["Narayanpet (Handloom Sarees)", "Makthal", "Kosgi", "Damargidda", "Maddur", "Dhanwada"],
      "Nirmal": ["Nirmal (Wooden Toys & Paintings)", "Bhainsa", "Khanapur", "Sarangapur", "Kaddampeddur", "Mamada"],
      "Nizamabad": ["Nizamabad City", "Armoor", "Bodhan (Nizam Sugar Factory Zone)", "Bheemgal", "Dichpally", "Varni", "Kotgiri", "Makloor"],
      "Peddapalli": ["Peddapalli", "Ramagundam Coal & Fertilizer City", "Godavarikhani (SCCL HQ Zone)", "Sultanabad", "Manthani", "Julapalli", "Odela"],
      "Rajanna Sircilla": ["Sircilla (Textile & Powerloom Hub of TS)", "Vemulawada", "Boinpally", "Yellareddypet", "Konaraopet", "Mustabad", "Gambhiraopet"],
      "Ranga Reddy": ["Maheshwaram Electronic Hardware Park", "Adibatla Aerospace SEZ (Tata / Boeing)", "Shamshabad GMR Aero SEZ", "Kothur Industrial Corridor", "Rajendranagar", "Ibrahimpatnam", "Chevella", "Shadnagar Industrial Area", "Attapur", "Gachibowli Border"],
      "Sangareddy": ["Patancheru Industrial Area (Pharma & Heavy Engineering)", "Pashamylaram Industrial Area", "Bollaram Industrial Area", "Gummadidala Industrial Zone", "Zaheerabad NIMZ Mega Auto Zone (Mahindra)", "Sangareddy", "Sadasivpet", "Kandi (IIT Hyderabad Zone)", "Kohir"],
      "Siddipet": ["Siddipet", "Gajwel Food Park & Logistics Hub", "Dubbak", "Husnabad", "Mulug", "Wargal", "Cheriyal", "Markook"],
      "Suryapet": ["Suryapet (Commercial Hub)", "Kodad", "Huzurnagar (Cement Cluster)", "Mellacheruvu Cement Zone", "Mattampally Cement Hub", "Thungathurthy", "Garidepally"],
      "Vikarabad": ["Vikarabad", "Tandur (Cement & Blue Limestone Capital)", "Pargi", "Kodangal", "Mominpet", "Doma", "Nawabpet"],
      "Wanaparthy": ["Wanaparthy", "Pebbair (Fish & Agri Mandi)", "Gopalpete", "Kothakota", "Revally", "Pangal"],
      "Warangal": ["Warangal City", "Kakatiya Mega Textile Park (KMTP)", "Wardhannapet", "Parkal", "Narsampet", "Geesugonda", "Atmakur"],
      "Yadadri Bhuvanagiri": ["Bhongir / Bhuvanagiri Industrial Estate", "Choutuppal Chemical Industrial Belt", "Pochampally (World Famous Ikkat Silk Hub)", "Yadagirigutta", "Mothkur", "Alair", "Bibinagar (AIIMS Zone)"]
    }
  },

  // ==========================================
  // 25. TRIPURA (8 Districts)
  // ==========================================
  "Tripura": {
    cities: {
      "Dhalai": ["Ambassa", "Kamalpur", "Gandacharra", "Longtharai Valley / Chawmanu", "Salema", "Manu"],
      "Gomati": ["Udaipur (Temple City)", "Amarpur", "Karbook", "Kakraban", "Matabari", "Killa"],
      "Khowai": ["Khowai", "Teliamura Industrial Area", "Padmabil", "Kalyanpur", "Champahowar"],
      "North Tripura": ["Dharmanagar (Commercial Gateway & Rail Hub)", "Kanchanpur", "Panisagar", "Damcherra", "Kadamtala", "Churaibari Border ICP"],
      "Sepahijala": ["Bishalgarh Industrial Area", "Sonamura Border Trade", "Jampuijala", "Mohanbhog", "Kathalia", "Boxanagar"],
      "South Tripura": ["Belonia", "Sabroom (Special Economic Zone & Maitri Bridge to Chittagong Port)", "Santirbazar", "Rajnagar", "Hrishyamukh", "Jolaibari"],
      "Unakoti": ["Kailashahar", "Kumarghat (Plywood & Agri Hub)", "Pecharthal", "Chandipur"],
      "West Tripura (Agartala)": ["Bodhjungnagar Industrial Growth Centre", "Agartala Capital City", "Agartala Integrated Checkpost (ICP)", "Dukli", "Jirania Industrial Area", "Ranirbazar", "Mohanpur", "Mandwi"]
    }
  },

  // ==========================================
  // 26. UTTAR PRADESH (75 Districts)
  // ==========================================
  "Uttar Pradesh": {
    cities: {
      "Agra": ["Foundry Nagar Industrial Area", "Sikandra Industrial Area", "Nunhai Industrial Estate", "Agra City (Leather Footwear Capital)", "Fatehabad", "Kheragarh", "Etmadpur", "Bah", "Kiraoli", "Shamsabad", "Achhnera"],
      "Aligarh": ["Aligarh Lock & Hardware Capital", "Tala Nagari Industrial Area", "Atrauli", "Khair", "Iglas", "Gabhana", "Chharra"],
      "Ambedkar Nagar": ["Akbarpur", "Tanda (Powerloom & NTPC Thermal)", "Jalalpur", "Alapur", "Bhitargao", "Kitehari"],
      "Amethi": ["Jagdishpur Industrial Area (BHEL / SAIL)", "Gauriganj", "Amethi", "Musafirkhana", "Tiloi", "Salon Border"],
      "Amroha": ["Amroha (Musical Instruments & Woodcraft)", "Gajraula Industrial Area (Jubilant Life / Chemicals)", "Hasanpur", "Dhanaura", "Joyi"],
      "Auraiya": ["Auraiya", "Dibiyapur (GAIL Petrochemical & NTPC Power)", "Bidhuna", "Ajitmal", "Achhalda", "Phaphund"],
      "Ayodhya (Faizabad)": ["Ayodhya Dham", "Faizabad Commercial City", "Rudauli", "Bikapur", "Sohawal Industrial Area", "Milkipur", "Masodha Sugar Mill Zone"],
      "Azamgarh": ["Azamgarh", "Phoolpur Pawai", "Mubarakpur (Silk Weaving)", "Lalganj", "Sagri", "Mehnagar", "Burhanpur", "Jiyanpur"],
      "Baghpat": ["Baghpat", "Baraut (Iron & Agricultural Tools)", "Khekra (Handloom & Textile)", "Chhaprauli", "Binauli", "Pilana"],
      "Bahraich": ["Bahraich", "Nanpara", "Rupaidiha (Indo-Nepal Border Trade Port)", "Kaiserganj", "Mahasi", "Payagpur", "Mihinpurwa"],
      "Ballia": ["Ballia", "Rasra", "Bansdih", "Bairia", "Sikanderpur (Perfume & Flowers)", "Belthara Road"],
      "Balrampur": ["Balrampur (Bajaj Sugar Mills)", "Tulsipur", "Utraula", "Gainsari", "Pachperwa"],
      "Banda": ["Banda", "Atarra (Rice Mill Mandi)", "Baberu", "Naraini", "Tindwari", "Oran"],
      "Barabanki": ["Kursi Road Industrial Area", "Barabanki", "Ramnagar", "Fatehpur", "Haidergarh", "Sirauli Ghauspur", "Zaidpur (Handloom)"],
      "Bareilly": ["Parsakhera Industrial Area", "Bareilly City (Zari-Zardozi Capital)", "Clutterbuckganj (Wood & Resin)", "Aonla (IFFCO Fertilizer Plant)", "Faridpur", "Nawabganj", "Baheri", "Mirganj"],
      "Basti": ["Basti", "Harraiya", "Rudhauli", "Captainganj", "Bhanpur", "Walterganj"],
      "Bhadohi": ["Bhadohi (Carpet City of South Asia)", "Gopiganj Industrial Area", "Suriyawan", "Aurai", "Khamaria", "Gyanpur"],
      "Bijnor": ["Bijnor", "Dhampur (Sugar & Chemical)", "Najibabad", "Chandpur", "Nagina (Wood Carving)", "Seohara", "Kiratpur"],
      "Budaun": ["Budaun", "Ujhani (Mentha Oil & Agri Mandi)", "Bilsi", "Dataganj", "Sahaswan", "Bisauli", "Islamnagar"],
      "Bulandshahr": ["Khurja (Ceramic Capital of India)", "Sikandrabad Industrial Area", "Bulandshahr City", "Gulawathi", "Jahangirabad", "Anupshahr", "Debai", "Siana", "Shikarpur"],
      "Chandauli": ["Ramnagar Industrial Area Phase 2", "Mughalsarai / Pt. Deen Dayal Upadhyaya Junction", "Chandauli", "Chakia", "Sakaldiha", "Dhanapur"],
      "Chitrakoot": ["Chitrakoot Dham (Karwi)", "Mau", "Manikpur Railway Junction", "Rajapur", "Pahari"],
      "Deoria": ["Deoria", "Bhatpar Rani", "Salempur", "Rudrapur", "Barhaj", "Gauri Bazar"],
      "Etah": ["Etah", "Jalesar (Brass Bells & Ghungroo)", "Kasganj Border", "Aliganj", "Marhara", "Sakit"],
      "Etawah": ["Etawah", "Jaswantnagar", "Saifai", "Bharthana", "Chakarnagar", "Bakewar"],
      "Farrukhabad": ["Farrukhabad (Block Print & Potato Hub)", "Fatehgarh Cantt", "Kaimganj (Tobacco & Mango)", "Amritpur", "Shamsabad", "Mohammadabad"],
      "Fatehpur": ["Fatehpur", "Malwan Industrial Area", "Bindki Mandi", "Khaga", "Koraon", "Haswa", "Ghazipur"],
      "Firozabad": ["Firozabad (Glass & Bangle Capital of India)", "Sikohabad", "Tundla Railway Junction", "Sirsaganj (Potato Hub)", "Jasrana", "Matsena Industrial Area"],
      "Gautam Buddha Nagar (Noida)": ["Noida Sector 57-68 Industrial Areas", "Noida Phase 2 Special Economic Zone (NSEZ)", "Greater Noida Ecotech Industrial Zones", "Surajpur Industrial Area", "Kasna Industrial Estate", "Jewar International Airport & Aerocity Zone", "Dadri Dry Port / ICD", "Greater Noida West", "Knowledge Park 1-5"],
      "Ghaziabad": ["Sahibabad Industrial Area Site 4", "Loni Industrial Area", "Kavi Nagar Industrial Area", "Bulandshahr Road Industrial Area", "South Side GT Road Industrial Area", "Modinagar (Textile & Steel)", "Muradnagar Ordnance Zone", "Dasna", "Pilkhuwa Border"],
      "Ghazipur": ["Ghazipur (Opium Factory)", "Zamania", "Mohammadabad", "Saidpur", "Jakhanian", "Dildarnagar Railway Hub"],
      "Gonda": ["Gonda", "Mankapur (ITI Telecom Complex)", "Colonelganj", "Tarabganj", "Katra Bazar", "Paraspur"],
      "Gorakhpur": ["GIDA Industrial Area (Gorakhpur)", "Gorakhpur City", "Sahjanwa Industrial Belt", "Bansgaon", "Chauri Chaura", "Campierganj", "Pipraich", "Khajni", "Barhalganj"],
      "Hamirpur": ["Hamirpur", "Sumerpur Industrial Area (Shoe & Metal)", "Maudaha", "Rath", "Sarila", "Kurara"],
      "Hapur": ["Hapur (Jaggery / Gur & Stainless Steel Mandi)", "Pilkhuwa (Textile & Handloom Hub)", "Garhmukteshwar", "Dhaulana Industrial Area", "Babu Garh"],
      "Hardoi": ["Hardoi", "Sandila Industrial Area (Berger Paints Mega Hub)", "Shahabad", "Bilgram", "Madhoganj", "Sandi", "Mallawan"],
      "Hathras": ["Hathras (Asafoetida / Hing & Colour Hub)", "Sadabad", "Sasni", "Sikandra Rao", "Mursan"],
      "Jalaun (Orai)": ["Orai Industrial Area", "Jalaun", "Konch", "Kalpi (Handmade Paper Capital)", "Madhogarh", "Radaura"],
      "Jaunpur": ["Siddharth Nagar Industrial Area Jaunpur", "Jaunpur City (Attar & Imarti)", "Shahganj", "Machhlishahr", "Badlapur", "Kerakat", "Mariahu", "Mungra Badshahpur"],
      "Jhansi": ["Jhansi BHEL Industrial Complex", "Bijoli Industrial Area", "Barua Sagar", "Mauranipur (Cloth & Agri Hub)", "Moth", "Garautha", "Babina Cantt", "Gursarai", "Chirgaon"],
      "Kannauj": ["Kannauj (Perfume & Ittar Capital of India)", "Makarand Nagar Perfumery Zone", "Chhibramau (Potato & Grain)", "Tirwa", "Gursahaiganj", "Talgram"],
      "Kanpur Dehat": ["Rania Industrial Area", "Jainpur Industrial Area", "Akbarpur", "Bhognipur", "Pukhrayan", "Rasulabad", "Derapur", "Sikandra"],
      "Kanpur Nagar": ["Panki Industrial Area Site 1-5", "Fazalganj Industrial Estate", "Dada Nagar Industrial Area", "Jajmau (Leather & Tannery Capital)", "Rooma Industrial Area", "Chaubepur", "Ghatampur Power Project", "Bilhaur", "Kalyanpur", "Chakeri Airport Industrial Area"],
      "Kasganj": ["Kasganj Railway Hub", "Ganjdundwara", "Patiyali", "Sahawar", "Soron (Shukar Kshetra)", "Sidhpura"],
      "Kaushambi": ["Manjhanpur", "Chail", "Sirathu", "Bharwari Mandi", "Muratganj", "Karari"],
      "Kushinagar (Padrauna)": ["Padrauna (Sugar Mills)", "Kushinagar Buddhist Circuit", "Hata", "Kasya", "Tamkuhi Raj", "Khadda", "Captainganj", "Fazilnagar"],
      "Lakhimpur Kheri": ["Lakhimpur", "Gola Gokarannath (Bajaj Sugar Giant)", "Mohammadi", "Palia Kalan", "Nighasan", "Dhaurahra", "Mailani"],
      "Lalitpur": ["Lalitpur (Granite & Power Hub)", "Mahroni", "Talbehat", "Madawara", "Bar", "Birdha"],
      "Lucknow": ["Amausi Industrial Area", "Sarojini Nagar Industrial Area", "Talkatora Industrial Estate", "Chinhat Industrial Area", "Mohanlalganj Logistics Hub", "Bakshi Ka Talab", "Malihabad (Dasheri Mango Capital)", "Kakori", "Gomti Nagar IT City", "Alambagh Commercial Hub"],
      "Maharajganj": ["Maharajganj", "Nautanwa (Sonauli Indo-Nepal ICP Dry Port)", "Nichlaul", "Pharenda / Anandnagar", "Siswa Bazar", "Kolhui"],
      "Mahoba": ["Mahoba (Granite & Betel Leaf Hub)", "Charkhari", "Kulpahar", "Kabrai (Stone Crusher Capital of UP)", "Panwari", "Kharela"],
      "Mainpuri": ["Mainpuri (Wooden Inlay / Tarkashi Hub)", "Bhongaon", "Karhal", "Kishni", "Ghiror", "Kuraoli", "Bewar"],
      "Mathura": ["Mathura Refinery (IOCL Mega Complex)", "Mathura City (Peda & Silver Crafts)", "Chhata Industrial Area", "Kosi Kalan Industrial Area", "Vrindavan", "Goverdhan", "Barsana", "Raya", "Baldeo"],
      "Mau": ["Mau Nath Bhanjan (Textile & Saree Hub)", "Muhammadabad Gohna", "Ghosi", "Madhuban", "Kopaganj", "Adari"],
      "Meerut": ["Partapur Industrial Area", "Mohkampur Industrial Complex", "Meerut Sports Goods & Scissors Capital", "Mawana (Sugar & Power)", "Sardhana", "Hastinapur", "Daurala Sugar Complex", "Kithore", "Modipuram Agricultural Hub"],
      "Mirzapur": ["Mirzapur (Handmade Carpet & Brassware Hub)", "Chunar (Ceramics & Stone)", "Vindhyachal", "Lalganj", "Marihan", "Padari", "Ahraura"],
      "Moradabad": ["Moradabad (Brass City / Peetal Nagari of India)", "Pakbara Industrial Area", "Rampur Road Industrial Area", "Kanth", "Bilari", "Thakurdwara", "Kundarki"],
      "Muzaffarnagar": ["Muzaffarnagar (Steel Rolling & Sugar Capital)", "Begrajpur Industrial Area", "Bhopa Road Industrial Belt", "Khatauli (Triveni Sugar Complex)", "Budhana", "Jansath", "Shahpur", "Purkazi"],
      "Pilibhit": ["Pilibhit (Flute / Bansuri Capital & Sugar)", "Bisalpur (Grain Mandi)", "Puranpur", "Barkhera", "Amariya", "Neoria Husainpur"],
      "Pratapgarh": ["Pratapgarh (Aonla / Gooseberry Capital of India)", "Kunda", "Lalganj Ajhara", "Patti", "Raniganj", "Kohdaur", "Antu"],
      "Prayagraj (Allahabad)": ["Naini Industrial Area", "Phulpur (IFFCO Mega Fertilizer Plant)", "Shankargarh (Silica Sand Capital)", "Prayagraj City", "Soraon", "Handia", "Karchana", "Bara Power Project Zone", "Mau Aima", "Meja Thermal Power Project"],
      "Raebareli": ["Raebareli Industrial Area", "Modern Coach Factory Lalganj (MCF)", "ITI Limited Complex Raebareli", "Fursatganj Aviation Zone", "Bachhrawan", "Salon", "Dalmau", "Maharajganj", "Unchahar (NTPC Thermal Power)"],
      "Rampur": ["Rampur (Mentha Oil & Sugar)", "Milak", "Bilaspur", "Shahabad", "Tanda", "Swar", "Chamraua"],
      "Saharanpur": ["Saharanpur (Wood Carving Capital of India)", "Pilkhani Industrial Area", "Deoband (Sugar & Education)", "Nakur", "Behat", "Gangoh", "Rampur Maniharan", "Sarsawa Airport Zone"],
      "Sambhal": ["Sambhal (Bone Handicraft & Mentha Hub)", "Chandausi (Grain & Mentha Oil Capital)", "Gunnaur", "Bahjoi", "Asmoli", "Babrala (Tata Chemicals / Yara Fertilizer)"],
      "Sant Kabir Nagar (Khalilabad)": ["Khalilabad (Handloom & Textile Market)", "Mehdawal", "Dhanghata", "Bakhira (Brass Utensils)", "Semariyawan", "Maghar"],
      "Shahjahanpur": ["Shahjahanpur (Rosa Thermal Power / Reliance)", "Kanth", "Powayan", "Tilhar", "Jalalabad", "Puwayan", "Nigohi"],
      "Shamli": ["Shamli (Steel & Sugar)", "Kairana", "Thana Bhawan (Bajaj Sugar)", "Kandhla", "Jhinjhana", "Unn"],
      "Shravasti": ["Binki", "Ikauna", "Payagpur Border", "Sirsiya", "Jamunaha", "Gilaula"],
      "Siddharthnagar (Navgarh)": ["Navgarh", "Bansi", "Shohratgarh", "Itwa", "Domariyaganj", "Birdpur (Kala Namak Rice Capital)", "Badhni Indo-Nepal Border"],
      "Sitapur": ["Sitapur", "Hargaon (Sugar Mill)", "Biswan (Sugar & Agri)", "Mahmoodabad", "Laharpur", "Sidhauli", "Misrikh", "Mahuwa"],
      "Sonbhadra (Robertsganj)": ["Singrauli Energy Belt UP Zone", "Anpara Super Thermal Power Station", "Obra Thermal Power Station", "Renukoot (Hindalco Aluminium Smelter)", "Robertsganj", "Chopin", "Duddhi", "Ghorawal", "Bijpur NTPC Complex", "Shaktinagar NTPC"],
      "Sultanpur": ["Sultanpur", "Amethi Border", "Kadipur", "Jaisinghpuri", "Lambhua", "Kurebhar", "Kudwar"],
      "Unnao": ["Unnao Industrial Area Site 1-2", "Banthar Leather Technology Park", "Dahi Chowki Industrial Area", "Shuklaganj", "Purwa", "Safipur", "Bangarmau", "Hasanganj", "Nawabganj", "Bighapur"],
      "Varanasi": ["Ramnagar Industrial Area Phase 1-2", "Karkhiyaon Agro Park (UPSIDA Mega Food Zone)", "Varanasi City (Banarasi Silk Sarees)", "DLW / BLW Diesel Locomotive Works", "Shivpur", "Pindra", "Rohania", "Sewapuri", "Araziline", "Raja Talab (Vegetable Export Hub)"]
    }
  },

  // ==========================================
  // 27. UTTARAKHAND (13 Districts)
  // ==========================================
  "Uttarakhand": {
    cities: {
      "Almora": ["Almora", "Ranikhet Cantt", "Dwarahat", "Bhikiyasain", "Chaukhutiya", "Someshwar", "Bhatronjkhan", "Jageshwar"],
      "Bageshwar": ["Bageshwar", "Kanda", "Kapkot", "Garur (Baijnath)", "Kafli Gair"],
      "Chamoli (Gopeshwar)": ["Gopeshwar", "Joshimath", "Karnaprayag", "Gauchar", "Chamoli", "Pipalkoti", "Ghat", "Pokhari", "Tharali", "Gairsain Capital Complex"],
      "Champawat": ["Champawat", "Tanakpur Railway & Border Hub", "Lohaghat", "Banbasa Indo-Nepal Border", "Pati", "Barakot"],
      "Dehradun": ["Selaqui Industrial Area (Pharma Capital)", "Patel Nagar Industrial Area", "Dehradun Capital City", "Rishikesh (Pharma & Tourism)", "Vikasnagar", "Doiwala (Sugar Mill Zone)", "Herbertpur", "Mussoorie", "Chakrata", "Kalsi"],
      "Haridwar": ["SIDCUL Integrated Industrial Estate Haridwar (BHEL/ITC/Hero/Dabur)", "Bhagwanpur Industrial Belt", "Roorkee Industrial & IIT Hub", "Bahadrabad", "Laksar (Sugar & Distillery)", "Manglaur", "Jwalapur", "Haridwar City"],
      "Nainital": ["Nainital", "Haldwani Commercial Capital", "Ramnagar (Jim Corbett / Wood Hub)", "Lalkuan (Century Pulp & Paper)", "Bhimtal", "Bhowali", "Kaladhungi", "Mukteshwar"],
      "Pauri Garhwal": ["Pauri", "Kotdwar Industrial Area (SIDCUL)", "Srinagar Garhwal Medical & Hydro Hub", "Lansdowne Cantt", "Thalisain", "Satpuli", "Dhumakot", "Chaubattakhal", "Rikhnikhal"],
      "Pithoragarh": ["Pithoragarh", "Dharchula Indo-Nepal Trade", "Didihat", "Gangolihat", "Berinag (Tea)", "Munsyari", "Jhoolaghat Border Port"],
      "Rudraprayag": ["Rudraprayag", "Ukhimath", "Agastyamuni", "Guptkashi", "Jakholi"],
      "Tehri Garhwal": ["New Tehri", "Tehri Dam Hydro Complex", "Narendra Nagar", "Chamba", "Ghansali", "Kirtinagar", "Devprayag", "Pratapnagar", "Dhanaulti"],
      "Udham Singh Nagar (Rudrapur)": ["Pantnagar SIDCUL (Auto Capital - Tata / Bajaj / Ashok Leyland)", "Rudrapur Commercial Hub", "Kashipur Industrial Area", "Kichha Industrial Area", "Sitarganj Integrated Industrial Estate (ELDECO SIDCUL)", "Bazpur (Sugar & Paper)", "Mahuakheraganj Industrial Belt", "Jaspur", "Khatima", "Gadarpur", "Nanakmatta"],
      "Uttarkashi": ["Uttarkashi", "Barkot", "Purola (Red Rice Hub)", "Bhatwari", "Mori", "Chinyalisaur Airport Zone", "Dunda", "Naugaon"]
    }
  },

  // ==========================================
  // 28. WEST BENGAL (23 Districts)
  // ==========================================
  "West Bengal": {
    cities: {
      "Alipurduar": ["Alipurduar (Tea & Timber Hub)", "Falakata", "Birpara", "Jaigaon (Indo-Bhutan Border Mega Port)", "Madarihat", "Kumargram", "Kalchini"],
      "Bankura": ["Bankura", "Bishnupur (Baluchari Silk & Terracotta)", "Barjora Industrial Area", "Mejia Thermal Power Station", "Mejia Industrial Belt", "Khatra", "Kotulpur", "Sonamukhi", "Onda", "Beliatore"],
      "Birbhum (Suri)": ["Suri", "Bolpur Santiniketan", "Rampurhat (Stone Mining Hub)", "Sainthia (Grain & Oil Mandi)", "Dubrajpur", "Nalhati", "Murarai", "Ilambazar", "Bakreswar Thermal Power"],
      "Cooch Behar": ["Cooch Behar", "Dinhata (Tobacco Hub)", "Mathabhanga", "Tufanganj", "Mekhliganj", "Changrabandha Border ICP", "Haldibari (Chilahati Rail Border)"],
      "Dakshin Dinajpur (Balurghat)": ["Balurghat", "Gangarampur", "Buniadpur", "Hili Indo-Bangladesh Border Port", "Kushmandi", "Kumarganj", "Harirampur"],
      "Darjeeling": ["Darjeeling (World Famous Champagne Tea)", "Kurseong", "Mirik", "Sukna", "Bijanbari", "Takdah", "Jorebungalow", "Rongli Rangliot"],
      "Hooghly (Chinsurah)": ["Dankuni Industrial & Freight Corridor Hub", "Rishra Industrial Area", "Serampore Textile Zone", "Uttarpara (Hindustan Motors Zone)", "Bhadreswar", "Chinsurah", "Chandannagar", "Bandel", "Tribeni (Tissue & Paper)", "Singur", "Arambagh (Poultry & Agri Hub)", "Tarakeswar", "Mogra", "Polba"],
      "Howrah": ["Howrah City", "Jalan Industrial Complex (Dhulagarh Mega Logistics)", "Uluberia Industrial Growth Centre", "Sankrail Industrial Park (Food & Poly)", "Bally", "Domjur", "Amta", "Bagnan", "Shibpur Foundry Hub", "Liluah", "Salap"],
      "Jalpaiguri": ["Jalpaiguri", "Malbazar (Dooars Tea Hub)", "Dhupguri (Agriculture & Potato Mandi)", "Mainaguri", "Rajganj Industrial Area", "Raninagar Industrial Estate", "Matiali", "Nagrakata", "Banarhat"],
      "Jhargram": ["Jhargram", "Lodhasuli", "Gopiballavpur", "Belpahari", "Nayagram", "Sankrail", "Binpur"],
      "Kalimpong": ["Kalimpong (Floriculture & Cardamom)", "Pedong", "Gorubathan", "Algarah", "Lava"],
      "Kolkata": ["Kolkata Port Trust (Syama Prasad Mookerjee Port)", "Taratala Industrial Estate", "Kasba Industrial Estate", "Salt Lake Sector V IT Hub", "New Town IT & Financial Hub", "BBD Bagh", "Burrabazar (Asia's Largest Wholesale Market)", "Park Street", "Sealdah", "Alipore", "Tangra (Leather & Tannery)", "Topsia", "Cossipore", "Metcalfe Street"],
      "Malda": ["English Bazar / Malda City (Mango & Silk Capital)", "Old Malda Industrial Growth Centre", "Gazole", "Chanchal", "Harishchandrapur", "Kaliachak (Silk Weaving)", "Baisnabnagar", "Manikchak", "Samsi Mandi"],
      "Murshidabad (Baharampur)": ["Baharampur", "Farakka Super Thermal Power (NTPC)", "Jangipur (Bidi & Silk Hub)", "Dhulian", "Kandi", "Lalgola Border", "Jiaganj-Azimganj", "Beldanga", "Domkal", "Raghunathganj", "Murshidabad Heritage City"],
      "Nadia (Krishnanagar)": ["Kalyani Industrial Growth Centre", "Krishnanagar", "Ranaghat", "Santipur (Taant Handloom Silk)", "Nabadwip", "Chakdaha", "Tehatta", "Karimpur", "Gayeshpur Industrial Area", "Haringhata Mega Dairy Farm Zone"],
      "North 24 Parganas (Barasat)": ["Barasat Commercial City", "Petrapole (India's Largest Land Port / ICP to Bangladesh)", "Bangaon", "Basirhat", "Barrackpore Industrial Belt", "Titagarh Wagons Hub", "Naihati (Jute Mills)", "Kanchrapara Railway Workshop", "Bhatpara", "Kamarhati", "Panihati", "Dum Dum Airport Zone", "Rajarhat", "Hasnabad", "Hingalganj"],
      "Paschim Bardhaman (Asansol)": ["Asansol Industrial & Coal Hub", "Durgapur Steel City (SAIL & Alloy Steel)", "Raniganj Coalfields", "Jamuria Industrial Estate", "Kulti Foundry Works", "Burnpur (IISCO Steel Plant)", "Andal Airport Logistics Hub", "Barakar", "Salanpur", "Pandabeswar"],
      "Paschim Medinipur (Midnapore)": ["Kharagpur Industrial Park & IIT Tech Zone", "Vidyasagar Industrial Park", "Medinipur City", "Ghatal", "Chandrakona", "Garhbeta (Potato Hub)", "Debra", "Dantan", "Salboni (RBI Note Press & Cement)"],
      "Purba Bardhaman (Bardhaman)": ["Bardhaman City (Rice Bowl of Bengal)", "Memari Mandi", "Kalna (Handloom Sarees)", "Katwa", "Guskara", "Bhatar", "Raina", "Jamalpur", "Shaktigarh (Langcha Hub)"],
      "Purba Medinipur (Tamluk)": ["Haldia Petrochemicals & Deepwater Port SEZ", "Haldia Industrial Complex (IOCL / Exide / Tata Chemicals)", "Kolaghat Thermal Power Zone", "Tamluk", "Contai / Kanthi (Cashew & Shrimp)", "Digha Tourism & Marine Port", "Egra", "Panskura (Flower & Vegetable Mandi)", "Nandigram Industrial Corridor", "Mahisadal"],
      "Purulia": ["Purulia", "Raghunathpur Industrial Park", "Santaldih Thermal Power", "Balarampur (Lac Hub)", "Jhalda", "Manbazar", "Baghmundi (Pumped Storage Project)", "Adra Railway Division", "Neturia Industrial Belt", "Para"],
      "South 24 Parganas (Alipore)": ["Falta Special Economic Zone (FSEZ)", "Budge Budge Industrial & Petroleum Depot", "Maheshtala Garment & Textile Hub", "Baruipur Industrial Estate", "Diamond Harbour Port", "Canning (Sundarbans Gateway)", "Kakdwip Marine Port", "Bhangar", "Sonarpur", "Bishnupur"],
      "Uttar Dinajpur (Raiganj)": ["Raiganj (Tulaipanji Aromatic Rice Capital)", "Islampur Commercial Hub", "Dalkhola Grain & Maize Rail Hub", "Kaliyaganj", "Karandighi", "Chopra", "Itahar", "Hemtabad"]
    }
  },

  // ==========================================
  // 29. ANDAMAN AND NICOBAR ISLANDS (3 Districts) [UT]
  // ==========================================
  "Andaman and Nicobar Islands": {
    cities: {
      "Nicobar": ["Car Nicobar", "Great Nicobar (Galathea Bay Transshipment Port)", "Nancowry", "Campbell Bay", "Katchal", "Kamorta"],
      "North and Middle Andaman": ["Mayabunder", "Diglipur", "Rangat", "Kadamtala", "Biliground", "Baratang Island"],
      "South Andaman": ["Port Blair / Sri Vijaya Puram (Capital City & Deepwater Port)", "Garacharma", "Prothrapur", "Havelock Island (Swaraj Dweep)", "Neil Island (Shaheed Dweep)", "Ferrargunj", "Hut Bay (Little Andaman)", "Chatham Island (Saw Mill)"]
    }
  },

  // ==========================================
  // 30. CHANDIGARH (1 District) [UT]
  // ==========================================
  "Chandigarh": {
    cities: {
      "Chandigarh": ["Industrial Area Phase 1", "Industrial Area Phase 2", "Sector 17 Commercial City Centre", "Manimajra", "Sector 34 Commercial Hub", "Sector 22 Market", "Sector 26 Timber & Grain Market", "Sector 35", "Sector 8/9", "Daria Transport Hub"]
    }
  },

  // ==========================================
  // 31. DADRA AND NAGAR HAVELI AND DAMAN AND DIU (3 Districts) [UT]
  // ==========================================
  "Dadra and Nagar Haveli and Daman and Diu": {
    cities: {
      "Dadra and Nagar Haveli": ["Silvassa Industrial Capital", "Piparia Industrial Estate", "Khadoli Industrial Area", "Amli Industrial Area", "Dadra Industrial Belt", "Naroli", "Masat Industrial Estate", "Rakholi", "Samarvarni", "Galonda"],
      "Daman": ["Daman City", "Kachigam Industrial Area", "Dabhel Industrial Estate", "Somnath Industrial Park", "Bhimpore Industrial Zone", "Kadaiya Industrial Area", "Moti Daman", "Nani Daman", "Marwad"],
      "Diu": ["Diu Town", "Ghoghla", "Vanakbara Marine & Fishing Port", "Fudam", "Bucharwada", "Nagoa"]
    }
  },

  // ==========================================
  // 32. DELHI (11 Districts) [NCT]
  // ==========================================
  "Delhi": {
    cities: {
      "Central Delhi": ["Connaught Place", "Karol Bagh Wholesale Market", "Pahar Ganj", "Daryaganj", "Chandni Chowk Wholesale Hub", "Sadar Bazar (Asia's Largest Toy & Household Market)", "Chawri Bazar Paper Market", "Naya Bazar Grain & Spice Mandi", "Kashmere Gate Auto Parts Hub"],
      "East Delhi": ["Patparganj Industrial Area", "Laxmi Nagar Commercial Hub", "Preet Vihar", "Mayur Vihar Phases 1-3", "Shakarpur", "Kalyanpuri", "Khichripur", "Geeta Colony"],
      "New Delhi": ["Barakhamba Road Financial District", "Chanakyapuri", "Connaught Circus", "Lodhi Road", "Khan Market", "Vasant Kunj Commercial Hub", "Gole Market", "Sarojini Nagar Wholesale Market", "INA Market"],
      "North Delhi": ["Sadar Bazar", "Civil Lines", "Kotwali", "Timarpur", "Gulabi Bagh", "Shakti Nagar", "Roop Nagar", "Sarai Rohilla Railway Hub", "Sadar Paharganj"],
      "North East Delhi": ["Seelampur Electronic Scrap Market", "Yamuna Vihar", "Shahdara Border", "Gokulpuri", "Karawal Nagar", "Mustafabad", "Brahampuri", "Nand Nagri"],
      "North West Delhi": ["Wazirpur Industrial Area (Stainless Steel Hub)", "Badli Industrial Estate", "Narela Industrial Mega Zone", "Rohini Commercial City", "Mangolpuri Industrial Area Phase 1-2", "Lawrence Road Industrial Area", "Saraswati Vihar", "Shakurpur", "Alipur Grain Hub", "Sultanpuri", "Kanjhawala"],
      "Shahdara": ["Jhilmil Industrial Area", "Friends Colony Industrial Area", "Gandhi Nagar (Asia's Largest Readymade Garment Market)", "Shahdara City", "Dilshad Garden Industrial Estate", "Vivek Vihar", "Mansarovar Park", "Seemapuri Border"],
      "South Delhi": ["Okhla Industrial Area Phase 1", "Okhla Industrial Area Phase 2", "Okhla Industrial Area Phase 3", "Nehru Place (Asia's Largest IT Hardware Market)", "Hauz Khas", "Saket Commercial Centre", "Lajpat Nagar Central Market", "Greater Kailash 1-2", "South Extension 1-2", "Malviya Nagar"],
      "South East Delhi": ["Mohan Cooperative Industrial Area", "Okhla Industrial Estate", "Badarpur Thermal Zone", "Kalkaji", "Jasola District Centre", "Sarita Vihar", "Tughlakabad Inland Container Depot (ICD - Asia's Largest Dry Port)", "Friends Colony", "New Friends Colony"],
      "South West Delhi": ["Dwarka Mega Sub-City", "Palam Airport Zone", "Vasant Kunj Industrial Area", "Najafgarh Grain Mandi", "Kapashera Border Industrial Belt", "Mahipalpur Hotel & Commercial Corridor", "Bijwasan Rail Terminal", "Udyog Vihar Border", "Matiala Industrial Area"],
      "West Delhi": ["Mayapuri Industrial Area Phases 1-2 (Engineering & Scrap Hub)", "Kirti Nagar (Asia's Largest Timber & Furniture Market)", "Naraina Industrial Area Phases 1-2", "Janakpuri District Centre", "Rajouri Garden", "Punjabi Bagh", "Tilak Nagar", "Moti Nagar Industrial Belt", "Tagore Garden", "Paschim Vihar", "Uttam Nagar"]
    }
  },

  // ==========================================
  // 33. JAMMU AND KASHMIR (20 Districts) [UT]
  // ==========================================
  "Jammu and Kashmir": {
    cities: {
      "Anantnag": ["Anantnag Commercial City", "Bijbehara", "Dooru Verinag", "Pahalgam", "Kokernag", "Mattan", "Achabal", "Qazigund Gateway Tunnel Hub", "Srigufwara"],
      "Bandipora": ["Bandipora", "Sumbal Sonawari", "Gurez Valley", "Hajan", "Ajas", "Tulail"],
      "Baramulla": ["Baramulla City", "Sopore (Asia's 2nd Largest Apple Mandi)", "Uri Hydel Power Project & Border", "Pattan", "Tangmarg", "Gulmarg", "Rafiabad", "Kreeri", "Boniyar"],
      "Budgam": ["Budgam", "Chadoora", "Beerwah", "Magam", "Khansahib", "Charar-i-Sharief", "BK Pora", "Ompora Industrial Estate"],
      "Doda": ["Doda", "Bhaderwah", "Thathri", "Gandoh / Bhalessa", "Assar", "Marmat", "Kastigarh"],
      "Ganderbal": ["Ganderbal", "Kangan Hydro Project", "Sonamarg", "Tullamulla", "Gund", "Lar", "Wakor"],
      "Jammu": ["Bari Brahmana Industrial Complex (Jammu's Largest Hub)", "Gangyal Industrial Area", "Digiana Industrial Estate", "Birpur Industrial Estate", "Jammu City", "Akhnoor", "R.S. Pura (World Famous Basmati Rice)", "Bishnah", "Nagrota", "Bahu", "Marh", "Dansal", "Khag"],
      "Kathua": ["Govindsar Industrial Area Kathua", "SICOP Industrial Estate Kathua", "Hiranagar", "Billawar", "Basohli", "Bani", "Nagri Parole", "Marheen", "Dingla Amb"],
      "Kishtwar": ["Kishtwar (Saffron & Hydro Hub)", "Padder (Sapphire Mines)", "Chhatroo", "Marwah", "Warwan", "Dachhan", "Nagseni"],
      "Kulgam": ["Kulgam", "Qaimoh", "Devsar", "D.H. Pora", "Frisal", "Yaripora", "Pahloo"],
      "Kupwara": ["Kupwara", "Handwara (Commercial Hub)", "Langate", "Karnah", "Lolab Valley", "Sogam", "Tangdhar", "Kralpora", "Trehgam"],
      "Poonch": ["Poonch", "Mandi", "Surankote", "Mendhar", "Haveli", "Balakote", "Chandak"],
      "Pulwama": ["Lassipora Industrial Growth Centre (Cold Storage & Food Hub)", "Pulwama City", "Pampore (Saffron Capital of India)", "Awantipora AIIMS & Airport Zone", "Tral", "Kakapora", "Litter", "Shadimarg"],
      "Rajouri": ["Rajouri", "Nowshera", "Sunderbani", "Kalakote Coal Mines", "Budhal", "Thannamandi", "Darhal", "Manjakote", "Kotranka"],
      "Ramban": ["Ramban", "Banihal Rail Tunnel Hub", "Batote", "Gool", "Ukhral", "Ramsu", "Chanderkote Baglihar Power Dam"],
      "Reasi": ["Reasi (Lithium Reserves Discovery Zone)", "Katra (Vaishno Devi Base)", "Pouni", "Mahore", "Chassana", "Arnas", "Salal Hydro Power Dam"],
      "Samba": ["Samba Industrial Growth Centre Phase 1-3", "SIDCO Industrial Complex Samba", "Vijaypur AIIMS Zone", "Ghagwal", "Ramgarh", "Bari Brahmana South", "Purmandal"],
      "Shopian": ["Shopian (Apple Capital of Kashmir)", "Zainapora Industrial Fruit Mandi", "Keller", "Hermain", "Keegam", "Imamsahib", "Sedow"],
      "Srinagar": ["Zainakote Industrial Estate", "Sanat Nagar Industrial Estate", "Bagh-e-Ali Mardan Khan Industrial Estate", "Lal Chowk Commercial Heart", "Nowhatta (Handicrafts & Pashmina)", "Batamaloo Transport Hub", "Pantha Chowk Stone Hub", "HMT Crossing", "Zakura", "Soura", "Hazratbal"],
      "Udhampur": ["Battal Ballian Industrial Area Udhampur", "Udhampur Northern Army Command", "Chenani (Shyama Prasad Mookerjee Tunnel)", "Ramnagar", "Majalta", "Dudu Basantgarh", "Panchari", "Gordi"]
    }
  },

  // ==========================================
  // 34. LADAKH (2 Districts) [UT]
  // ==========================================
  "Ladakh": {
    cities: {
      "Kargil": ["Kargil Commercial Town", "Drass (Second Coldest Inhabited Place)", "Sankoo", "Zanskar / Padum", "Shakar Chiktan", "Trespone", "Mulbekh", "Batalik Border Trade", "Minamarg"],
      "Leh": ["Leh Capital Town", "Choglamsar Commercial Hub", "Nimmu Hydel Project", "Khaltsi", "Nubra Valley / Diskit", "Nyoma", "Durbuk (Pangong Lake Base)", "Changthang (Pashmina Wool Capital)", "Upshi Trade Junction", "Saspol", "Tangtse"]
    }
  },

  // ==========================================
  // 35. LAKSHADWEEP (1 District) [UT]
  // ==========================================
  "Lakshadweep": {
    cities: {
      "Lakshadweep": ["Kavaratti Capital Island", "Agatti Airport Island", "Andrott Island (Coir & Copra)", "Minicoy Island (Tuna Cannery Hub)", "Amini Island", "Kadmat Island", "Kalpeni Island", "Chetlat Island", "Kiltan Island", "Bitra Island", "Bangaram Atoll"]
    }
  },

  // ==========================================
  // 36. PUDUCHERRY (4 Districts) [UT]
  // ==========================================
  "Puducherry": {
    cities: {
      "Karaikal": ["Karaikal Deepwater Port", "Karaikal City", "Kottucherry", "Nedungadu", "Thirunallar", "Neravy", "Grand Aldee"],
      "Mahe": ["Mahe Town", "Chalakara", "Pandakkal", "Cherukallayi", "Manjakkal"],
      "Puducherry": ["Sedharapet Industrial Estate", "Mettupalayam Industrial Estate", "Thattanchavady Industrial Area", "Puducherry Capital City", "Oulgaret", "Villianur", "Ariyankuppam", "Bahour", "Kirumampakkam Industrial Belt", "Kalapet Pharma Zone", "Mannadipet", "Lawspet"],
      "Yanam": ["Yanam Town", "Ferry Road Port Zone", "Savithri Nagar", "Kanakkalapeta", "Agraharam", "Guerempeta"]
    }
  }
};

// Generate the JS module
const jsOutput = `/**
 * Comprehensive Indian States, Union Territories, Districts, and Villages/Talukas Dataset
 * Contains all 28 States and 8 Union Territories of India (36 States & UTs)
 * Covering all 780+ official administrative districts and key mandis/industrial hubs.
 */

export const INDIAN_LOCATIONS = ${JSON.stringify(FULL_INDIAN_LOCATIONS, null, 2)};

/**
 * Get all available Indian States & Union Territories (All 36 States & UTs)
 */
export function getIndianStates() {
  return Object.keys(INDIAN_LOCATIONS).sort((a, b) => a.localeCompare(b));
}

/**
 * Get cities/districts for a given state or UT
 */
export function getCitiesByState(stateName) {
  if (!stateName) return [];
  const stateData = INDIAN_LOCATIONS[stateName];
  if (!stateData || !stateData.cities) return [];
  return Object.keys(stateData.cities).sort((a, b) => a.localeCompare(b));
}

/**
 * Get villages/talukas for a given state and city/district
 */
export function getVillagesByCity(stateName, cityName) {
  if (!stateName || !cityName) return [];
  const stateData = INDIAN_LOCATIONS[stateName];
  if (!stateData || !stateData.cities) return [];
  const villages = stateData.cities[cityName];
  return Array.isArray(villages) ? [...villages].sort((a, b) => a.localeCompare(b)) : [];
}
`;

const targetPath = path.join(process.cwd(), 'utils', 'indianLocations.js');
fs.writeFileSync(targetPath, jsOutput, 'utf8');
console.log('Successfully wrote full Indian locations dataset to', targetPath);

// Print stats
const states = Object.keys(FULL_INDIAN_LOCATIONS);
let totalDistricts = 0;
let totalTalukas = 0;

for (const st of states) {
  const districts = Object.keys(FULL_INDIAN_LOCATIONS[st].cities);
  totalDistricts += districts.length;
  for (const d of districts) {
    totalTalukas += FULL_INDIAN_LOCATIONS[st].cities[d].length;
  }
}

console.log(`States & UTs count: ${states.length}`);
console.log(`Total Districts count: ${totalDistricts}`);
console.log(`Total Talukas/Hubs count: ${totalTalukas}`);
