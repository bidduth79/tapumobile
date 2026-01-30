-- Database Schema for LICell MediaHub
CREATE DATABASE IF NOT EXISTS `licell_dbnew`;
USE `licell_dbnew`;

-- Users Table
CREATE TABLE IF NOT EXISTS `users` (
  `id` varchar(50) NOT NULL,
  `username` varchar(50) NOT NULL UNIQUE,
  `password` varchar(255) NOT NULL,
  `name` varchar(100) NOT NULL,
  `role` enum('admin','user') DEFAULT 'user',
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Initial Admin User
INSERT IGNORE INTO `users` (`id`, `username`, `password`, `name`, `role`) VALUES
('1', 'admin', '123', 'Admin User', 'admin');

-- Links Table
CREATE TABLE IF NOT EXISTS `links` (
  `id` varchar(50) NOT NULL,
  `title` varchar(100) NOT NULL,
  `url` varchar(500) NOT NULL,
  `logo_url` varchar(500) DEFAULT '',
  `category` varchar(50) NOT NULL,
  `sub_category` varchar(50) DEFAULT '',
  `child_category` varchar(50) DEFAULT '',
  `sort_order` int(11) DEFAULT 0,
  `is_favorite` tinyint(1) DEFAULT 0,
  `last_opened` bigint(20) DEFAULT 0,
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Keywords Table
CREATE TABLE IF NOT EXISTS `keywords` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `keyword` varchar(100) NOT NULL UNIQUE,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Activity Logs
CREATE TABLE IF NOT EXISTS `activity_logs` (
  `id` varchar(50) NOT NULL,
  `user` varchar(50) NOT NULL,
  `action` varchar(255) NOT NULL,
  `timestamp` bigint(20) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Seed Data
INSERT IGNORE INTO `links` (`id`, `title`, `url`, `category`, `sub_category`, `child_category`, `sort_order`, `is_favorite`) VALUES
-- ... (Previous links hidden for brevity) ...
-- Talkshow (Neutral / Mainstream)
('ts_neu_01', 'Tritiyo Matra', 'https://www.youtube.com/@TritiyoMatra', 'talkshow', 'ts_neutral', '', 900, 0),
('ts_neu_02', 'Channel i Talkshow', 'https://www.youtube.com/@ChanneliNews', 'talkshow', 'ts_neutral', '', 901, 0),
('ts_neu_03', 'ATN News Talkshow', 'https://www.youtube.com/@atnnewslive', 'talkshow', 'ts_neutral', '', 902, 0),
('ts_neu_04', 'Jamuna TV Talkshow', 'https://www.youtube.com/@JamunaTVbd', 'talkshow', 'ts_neutral', '', 903, 0),
('ts_neu_05', 'NTV Talkshow', 'https://www.youtube.com/@ntvbd', 'talkshow', 'ts_neutral', '', 904, 0),
('ts_neu_06', 'RTV Talkshow', 'https://www.youtube.com/@RtvTalkshow', 'talkshow', 'ts_neutral', '', 905, 0),
('ts_neu_07', 'Channel 24 Talkshow', 'https://www.youtube.com/@Channel24Youtube', 'talkshow', 'ts_neutral', '', 906, 0),
('ts_neu_08', 'DBC News Talkshow', 'https://www.youtube.com/@dbcnews_tv', 'talkshow', 'ts_neutral', '', 907, 0),
('ts_neu_09', 'Deutsche Welle Bengali', 'https://www.youtube.com/@DWBengali', 'talkshow', 'ts_neutral', '', 908, 0),
('ts_neu_10', 'BBC News Bangla', 'https://www.youtube.com/@BBCBangla', 'talkshow', 'ts_neutral', '', 909, 0),

-- Talkshow (Awami League Leaning)
('ts_al_01', 'Ekattor TV Talkshow', 'https://www.youtube.com/@ekattor_tv', 'talkshow', 'ts_awami', '', 920, 0),
('ts_al_02', 'Somoy TV Talkshow', 'https://www.youtube.com/@somoytvnetupdate', 'talkshow', 'ts_awami', '', 921, 0),
('ts_al_03', 'Desh TV Talkshow', 'https://www.youtube.com/@DeshTelevision', 'talkshow', 'ts_awami', '', 922, 0),
('ts_al_04', 'GTV Talkshow', 'https://www.youtube.com/@GaziSatelliteTelevisionLtd', 'talkshow', 'ts_awami', '', 923, 0),
('ts_al_05', 'Mohona TV', 'https://www.youtube.com/@MohonaTVLimited', 'talkshow', 'ts_awami', '', 924, 0),
('ts_al_06', 'Asian TV', 'https://www.youtube.com/@AsianTVBD', 'talkshow', 'ts_awami', '', 925, 0),
('ts_al_07', 'BTV', 'https://www.youtube.com/@BangladeshTelevision_BTV', 'talkshow', 'ts_awami', '', 926, 0),

-- Talkshow (BNP Leaning)
('ts_bnp_01', 'BNP Media Cell', 'https://www.youtube.com/@bnpmediacell', 'talkshow', 'ts_bnp', '', 940, 0),
('ts_bnp_02', 'Nagorik Oikya', 'https://www.youtube.com/@NagorikOikyaOfficial', 'talkshow', 'ts_bnp', '', 941, 0),
('ts_bnp_03', 'Amar Desh', 'https://www.youtube.com/@AmarDeshUK', 'talkshow', 'ts_bnp', '', 942, 0),
('ts_bnp_04', 'Doynik Dingkal', 'https://www.youtube.com/@DoynikDingkal', 'talkshow', 'ts_bnp', '', 943, 0),

-- Talkshow (Jamaat / Islamic)
('ts_jam_01', 'Basherkella', 'https://www.youtube.com/@BasherkellaOfficial', 'talkshow', 'ts_jamaat', '', 960, 0),
('ts_jam_02', 'Face The People', 'https://www.youtube.com/@FaceThePeople', 'talkshow', 'ts_jamaat', '', 961, 0),
('ts_jam_03', 'Islamic TV', 'https://www.youtube.com/@IslamicTVbd', 'talkshow', 'ts_jamaat', '', 962, 0),

-- Talkshow (Online Activists / Independent)
('ts_act_01', 'Khaled Muhiuddin (Thikana)', 'https://www.youtube.com/@ThikanaOfficial', 'talkshow', 'ts_activist', '', 980, 0),
('ts_act_02', 'Pinaki Bhattacharya', 'https://www.youtube.com/@PinakiBhattacharya', 'talkshow', 'ts_activist', '', 981, 0),
('ts_act_03', 'Elias Hossain', 'https://www.youtube.com/@EliasHossain', 'talkshow', 'ts_activist', '', 982, 0),
('ts_act_04', 'Konak Sarwar', 'https://www.youtube.com/@KonakSarwar', 'talkshow', 'ts_activist', '', 983, 0),
('ts_act_05', 'Zulkarnain Saer', 'https://www.youtube.com/@zulkarnainsaer', 'talkshow', 'ts_activist', '', 984, 0),
('ts_act_06', 'Netra News', 'https://www.youtube.com/@NetraNews', 'talkshow', 'ts_activist', '', 985, 0),
('ts_act_07', 'Talk with Rumi', 'https://www.youtube.com/@TalkwithRumi', 'talkshow', 'ts_activist', '', 986, 0),

-- Talkshow (Army Officers)
('ts_army_01', 'Major Delwar Hossain', 'https://www.youtube.com/@MajorDelwarHossainOfficial', 'talkshow', 'ts_army', '', 1100, 0),
('ts_army_02', 'Lt Gen Hasan Sarwardy', 'https://www.youtube.com/@ChowdhuryHasanSarwardy', 'talkshow', 'ts_army', '', 1101, 0),
('ts_army_03', 'General Ibrahim', 'https://www.youtube.com/@GeneralIbrahim', 'talkshow', 'ts_army', '', 1102, 0),
('ts_army_04', 'Col Oli Ahmad', 'https://www.youtube.com/@ColOliAhmad', 'talkshow', 'ts_army', '', 1103, 0),
('ts_army_05', 'Major Mizan', 'https://www.youtube.com/@MajorMizan', 'talkshow', 'ts_army', '', 1104, 0),

-- Myanmar News
('mn_nat_01', 'Global New Light of Myanmar', 'https://www.gnlm.com.mm', 'newspaper', 'myanmar', 'my_national', 500, 0),
('mn_nat_02', 'The Mirror (Kyemon)', 'https://www.facebook.com/TheMirrorDaily', 'newspaper', 'myanmar', 'my_national', 501, 0),
('mn_nat_03', 'Myanma Alin', 'https://www.facebook.com/MyanmaAlinDaily', 'newspaper', 'myanmar', 'my_national', 502, 0),

('mn_eng_01', 'The Irrawaddy', 'https://www.irrawaddy.com', 'newspaper', 'myanmar', 'my_english', 510, 0),
('mn_eng_02', 'Myanmar Now', 'https://myanmar-now.org', 'newspaper', 'myanmar', 'my_english', 511, 0),
('mn_eng_03', 'Mizzima English', 'https://www.mizzima.com', 'newspaper', 'myanmar', 'my_english', 512, 0),
('mn_eng_04', 'Frontier Myanmar', 'https://www.frontiermyanmar.net', 'newspaper', 'myanmar', 'my_english', 513, 0),

('mn_onl_01', 'Khit Thit Media', 'https://www.khitthitmedia.org', 'newspaper', 'myanmar', 'my_online', 520, 0),
('mn_onl_02', 'Democratic Voice of Burma (DVB)', 'https://english.dvb.no', 'newspaper', 'myanmar', 'my_online', 521, 0),

('mn_loc_01', 'Narinjara News', 'https://narinjara.com', 'newspaper', 'myanmar', 'my_local', 530, 0),
('mn_loc_02', 'Western News', 'https://westernnews.news', 'newspaper', 'myanmar', 'my_local', 531, 0),
('mn_loc_03', 'Development Media Group', 'https://www.dmediag.com', 'newspaper', 'myanmar', 'my_local', 532, 0),

-- Facebook (Pahari Songothon)
('fb_pah_01', 'Arakan Army (The Way of Rakhita)', 'https://www.facebook.com/TheWayOfRakhita', 'facebook', 'fb_pahari', '', 600, 0),
('fb_pah_02', 'United People\'s Democratic Front (UPDF)', 'https://www.facebook.com/updf.org', 'facebook', 'fb_pahari', '', 601, 0),
('fb_pah_03', 'PCJSS (JSS Santu)', 'https://www.facebook.com/pcjss.org', 'facebook', 'fb_pahari', '', 602, 0),
('fb_pah_04', 'UPDF Ganatantrik', 'https://www.facebook.com/updf.democratic', 'facebook', 'fb_pahari', '', 603, 0),
('fb_pah_05', 'Kuki-Chin National Front (KNF)', 'https://www.facebook.com/knf.official', 'facebook', 'fb_pahari', '', 604, 0),

-- Facebook (Defense Forces)
('fb_def_01', 'Bangladesh Army', 'https://www.facebook.com/bdarmy.army.mil.bd', 'facebook', 'fb_defense', '', 610, 0),
('fb_def_02', 'Bangladesh Navy', 'https://www.facebook.com/BangladeshNavyOfficial', 'facebook', 'fb_defense', '', 611, 0),
('fb_def_03', 'Bangladesh Air Force', 'https://www.facebook.com/baf.mil.bd', 'facebook', 'fb_defense', '', 612, 0),
('fb_def_04', 'Bangladesh Coast Guard', 'https://www.facebook.com/BangladeshCoastGuardOfficial', 'facebook', 'fb_defense', '', 613, 0),
('fb_def_05', 'ISPR', 'https://www.facebook.com/ISPR.Bangladesh', 'facebook', 'fb_defense', '', 614, 0),

-- Facebook (Police & Law Enforcement)
('fb_pol_01', 'Bangladesh Police', 'https://www.facebook.com/BangladeshPoliceOfficialPage', 'facebook', 'fb_police', '', 620, 0),
('fb_pol_02', 'Rapid Action Battalion (RAB)', 'https://www.facebook.com/rabonlinemediacell', 'facebook', 'fb_police', '', 621, 0),
('fb_pol_03', 'Bangladesh Ansar & VDP', 'https://www.facebook.com/ansarvdp.gov.bd', 'facebook', 'fb_police', '', 622, 0),
('fb_pol_04', 'Bangladesh Fire Service', 'https://www.facebook.com/fscd.bd', 'facebook', 'fb_police', '', 623, 0),
('fb_pol_05', 'DMP (Dhaka Metropolitan Police)', 'https://www.facebook.com/dmpdhaka', 'facebook', 'fb_police', '', 624, 0),

-- Facebook (Govt Agencies)
('fb_gov_01', 'ICT Division', 'https://www.facebook.com/ictdivisionbd', 'facebook', 'fb_govt', '', 630, 0),
('fb_gov_02', 'Passport & Immigration', 'https://www.facebook.com/dip.gov.bd', 'facebook', 'fb_govt', '', 631, 0),
('fb_gov_03', 'Bangladesh Government', 'https://www.facebook.com/BangladeshGov', 'facebook', 'fb_govt', '', 632, 0),
('fb_gov_04', 'Ministry of Foreign Affairs', 'https://www.facebook.com/mofa.gov.bd', 'facebook', 'fb_govt', '', 633, 0),

-- YouTube (Pahari Songothon)
('yt_pah_01', 'Arakan Army Media', 'https://www.youtube.com/@ArakanArmyMedia', 'youtube', 'yt_pahari', '', 700, 0),
('yt_pah_02', 'UPDF Media', 'https://www.youtube.com/@UPDFMedia', 'youtube', 'yt_pahari', '', 701, 0),
('yt_pah_03', 'CHT News', 'https://www.youtube.com/@chtnews', 'youtube', 'yt_pahari', '', 702, 0),
('yt_pah_04', 'Hill Voice', 'https://www.youtube.com/@HillVoice', 'youtube', 'yt_pahari', '', 703, 0),

-- YouTube (Defense Forces)
('yt_def_01', 'Bangladesh Army', 'https://www.youtube.com/@BangladeshArmy_official', 'youtube', 'yt_defense', '', 710, 0),
('yt_def_02', 'Bangladesh Navy', 'https://www.youtube.com/@BangladeshNavy', 'youtube', 'yt_defense', '', 711, 0),
('yt_def_03', 'Bangladesh Air Force', 'https://www.youtube.com/@BangladeshAirForce', 'youtube', 'yt_defense', '', 712, 0),
('yt_def_04', 'Bangladesh Coast Guard', 'https://www.youtube.com/@BangladeshCoastGuard', 'youtube', 'yt_defense', '', 713, 0),
('yt_def_05', 'ISPR', 'https://www.youtube.com/@ISPRBangladesh', 'youtube', 'yt_defense', '', 714, 0),

-- YouTube (Police & Law Enforcement)
('yt_pol_01', 'Bangladesh Police', 'https://www.youtube.com/@BangladeshPoliceOfficial', 'youtube', 'yt_police', '', 720, 0),
('yt_pol_02', 'Rapid Action Battalion', 'https://www.youtube.com/@RapidActionBattalion', 'youtube', 'yt_police', '', 721, 0),
('yt_pol_03', 'Bangladesh Ansar VDP', 'https://www.youtube.com/@BangladeshAnsarVDP', 'youtube', 'yt_police', '', 722, 0),
('yt_pol_04', 'Fire Service Bangladesh', 'https://www.youtube.com/@BangladeshFireService', 'youtube', 'yt_police', '', 723, 0),

-- YouTube (Govt Agencies)
('yt_gov_01', 'ICT Division Bangladesh', 'https://www.youtube.com/@ICTDivisionBangladesh', 'youtube', 'yt_govt', '', 730, 0),
('yt_gov_02', 'BTV (Bangladesh Television)', 'https://www.youtube.com/@BangladeshTelevision_BTV', 'youtube', 'yt_govt', '', 731, 0),

-- Propagandist (Awami Leaning)
('pr_al_01', 'Nijhoom Majumder', 'https://www.youtube.com/@NijhoomMajumder', 'propagandist', 'prop_awami', '', 1000, 0),
('pr_al_02', 'Subhash Singha Roy', 'https://www.youtube.com/@SubhashSinghaRoy', 'propagandist', 'prop_awami', '', 1001, 0),
('pr_al_03', 'FM Shahin (Gourab 71)', 'https://www.youtube.com/@Gourab71TV', 'propagandist', 'prop_awami', '', 1002, 0),
('pr_al_04', 'Tonmoy Ahmed', 'https://www.youtube.com/@TonmoyAhmedOfficial', 'propagandist', 'prop_awami', '', 1003, 0),
('pr_al_05', 'Suchinta Foundation', 'https://www.youtube.com/@SuchintaFoundation', 'propagandist', 'prop_awami', '', 1004, 0),

-- Propagandist (BNP Leaning / Anti-Govt)
('pr_bnp_01', 'Pinaki Bhattacharya', 'https://www.youtube.com/@PinakiBhattacharya', 'propagandist', 'prop_bnp', '', 1020, 0),
('pr_bnp_02', 'Elias Hossain', 'https://www.youtube.com/@EliasHossain', 'propagandist', 'prop_bnp', '', 1021, 0),
('pr_bnp_03', 'Konak Sarwar', 'https://www.youtube.com/@KonakSarwar', 'propagandist', 'prop_bnp', '', 1022, 0),
('pr_bnp_04', 'Abdur Rab Bhuttow', 'https://www.youtube.com/@AbdurRabBhuttow', 'propagandist', 'prop_bnp', '', 1023, 0),
('pr_bnp_05', 'Dr. Tajhashmi', 'https://www.youtube.com/@DrTajHashmi', 'propagandist', 'prop_bnp', '', 1024, 0),

-- Propagandist (Jamaat Leaning)
('pr_jam_01', 'Basherkella', 'https://www.youtube.com/@BasherkellaOfficial', 'propagandist', 'prop_jamaat', '', 1040, 0),
('pr_jam_02', 'Titumir Media', 'https://www.youtube.com/@TitumirMedia', 'propagandist', 'prop_jamaat', '', 1041, 0),
('pr_jam_03', 'Razniti', 'https://www.youtube.com/@razniti', 'propagandist', 'prop_jamaat', '', 1042, 0),

-- Propagandist (Others / Critical / International)
('pr_oth_01', 'Zulkarnain Saer', 'https://www.youtube.com/@zulkarnainsaer', 'propagandist', 'prop_others', '', 1060, 0),
('pr_oth_02', 'Netra News', 'https://www.youtube.com/@NetraNews', 'propagandist', 'prop_others', '', 1061, 0),
('pr_oth_03', 'Nagorik TV (Tito Rahman)', 'https://www.youtube.com/@NagorikTV', 'propagandist', 'prop_others', '', 1062, 0),
('pr_oth_04', 'The Mirror Asia', 'https://www.youtube.com/@TheMirrorAsia', 'propagandist', 'prop_others', '', 1063, 0);

-- Initial Keywords
INSERT IGNORE INTO `keywords` (`keyword`) VALUES ('Bangladesh'), ('Dhaka'), ('Politics');