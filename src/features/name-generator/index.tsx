import { useState, useCallback } from 'react';
import { ToolShell } from '../../shell/ToolShell';
import { useI18n, useToolI18n } from '../../shared/context/I18nContext';
import { HelpSection } from '../../shared/components/HelpSection';

// ── Types ──

type Gender = 'm' | 'f' | 'n';
type Style = 'random' | 'elegant' | 'grand' | 'poetic' | 'classic';

interface NameChar {
  char: string;
  meaning: string;
  source: string;
  sourceDetail: string;
  gender: Gender;
  tags: Style[];
}

interface GeneratedName {
  surname: string;
  given: string;
  full: string;
  chars: NameChar[];
  explanation: string;
  figure?: string;
}

// ── Character Pool ──

const CHARS: NameChar[] = [
  // ── 品德修养 Virtue ──
  { char: '仁', meaning: '仁爱，仁慈', source: '《论语·里仁》', sourceDetail: '里仁为美。择不处仁，焉得知？', gender: 'm', tags: ['elegant', 'classic', 'grand'] },
  { char: '义', meaning: '正义，道义', source: '《孟子·告子上》', sourceDetail: '生，亦我所欲也；义，亦我所欲也。舍生而取义者也。', gender: 'm', tags: ['grand', 'classic'] },
  { char: '礼', meaning: '礼仪，谦恭', source: '《论语·学而》', sourceDetail: '礼之用，和为贵。', gender: 'm', tags: ['elegant', 'classic'] },
  { char: '智', meaning: '智慧，明达', source: '《论语·雍也》', sourceDetail: '知者乐水，仁者乐山。', gender: 'n', tags: ['elegant', 'grand', 'classic'] },
  { char: '信', meaning: '诚信，守信', source: '《论语·为政》', sourceDetail: '人而无信，不知其可也。', gender: 'm', tags: ['classic', 'grand'] },
  { char: '德', meaning: '品德，德行', source: '《大学》', sourceDetail: '大学之道，在明明德。', gender: 'n', tags: ['elegant', 'grand', 'classic'] },
  { char: '诚', meaning: '真诚，诚实', source: '《中庸》', sourceDetail: '诚者，天之道也；诚之者，人之道也。', gender: 'n', tags: ['elegant', 'classic', 'grand'] },
  { char: '谦', meaning: '谦虚，谦逊', source: '《周易·谦卦》', sourceDetail: '谦谦君子，卑以自牧也。', gender: 'm', tags: ['elegant', 'classic', 'poetic'] },
  { char: '敬', meaning: '恭敬，敬畏', source: '《论语·季氏》', sourceDetail: '君子有九思：视思明，听思聪，色思温，貌思恭。', gender: 'n', tags: ['classic', 'elegant'] },
  { char: '善', meaning: '善良，美好', source: '《大学》', sourceDetail: '止于至善。', gender: 'f', tags: ['elegant', 'classic'] },
  { char: '贤', meaning: '贤能，贤德', source: '《论语·里仁》', sourceDetail: '见贤思齐焉，见不贤而内自省也。', gender: 'n', tags: ['grand', 'classic', 'elegant'] },
  { char: '孝', meaning: '孝顺，孝道', source: '《论语·学而》', sourceDetail: '孝弟也者，其为仁之本与！', gender: 'n', tags: ['classic', 'grand'] },
  { char: '忠', meaning: '忠诚，尽心', source: '《论语·里仁》', sourceDetail: '夫子之道，忠恕而已矣。', gender: 'm', tags: ['classic', 'grand'] },
  { char: '恕', meaning: '宽恕，体谅', source: '《论语·卫灵公》', sourceDetail: '其恕乎！己所不欲，勿施于人。', gender: 'n', tags: ['classic', 'elegant'] },
  { char: '勇', meaning: '勇敢，刚毅', source: '《论语·宪问》', sourceDetail: '仁者必有勇。', gender: 'm', tags: ['grand', 'classic'] },
  { char: '毅', meaning: '坚毅，果决', source: '《论语·泰伯》', sourceDetail: '士不可以不弘毅，任重而道远。', gender: 'm', tags: ['grand', 'classic'] },
  { char: '刚', meaning: '刚强，正直', source: '《论语·公冶长》', sourceDetail: '吾未见刚者。', gender: 'm', tags: ['grand', 'classic'] },
  { char: '正', meaning: '正直，端正', source: '《论语·颜渊》', sourceDetail: '政者，正也。子帅以正，孰敢不正？', gender: 'm', tags: ['grand', 'classic'] },
  { char: '和', meaning: '和谐，温和', source: '《论语·学而》', sourceDetail: '礼之用，和为贵。', gender: 'n', tags: ['elegant', 'classic', 'poetic'] },
  { char: '端', meaning: '端正，庄重', source: '《论语·尧曰》', sourceDetail: '君子正其衣冠，尊其瞻视。', gender: 'm', tags: ['classic', 'elegant'] },

  // ── 自然意象 Nature ──
  { char: '山', meaning: '高山，稳重', source: '《论语·雍也》', sourceDetail: '知者乐水，仁者乐山。', gender: 'm', tags: ['grand', 'classic', 'poetic'] },
  { char: '川', meaning: '河流，奔流', source: '《论语·子罕》', sourceDetail: '逝者如斯夫，不舍昼夜。', gender: 'm', tags: ['grand', 'poetic', 'elegant'] },
  { char: '风', meaning: '清风，风骨', source: '《诗经·国风》', sourceDetail: '关关雎鸠，在河之洲。', gender: 'n', tags: ['poetic', 'elegant', 'grand'] },
  { char: '云', meaning: '白云，高远', source: '《诗经·小雅》', sourceDetail: '皎皎白驹，在彼空谷。', gender: 'n', tags: ['poetic', 'elegant', 'grand'] },
  { char: '月', meaning: '明月，皎洁', source: '李白《静夜思》', sourceDetail: '举头望明月，低头思故乡。', gender: 'f', tags: ['poetic', 'elegant'] },
  { char: '星', meaning: '星辰，璀璨', source: '《诗经·小雅》', sourceDetail: '嘒彼小星，三五在东。', gender: 'n', tags: ['poetic', 'elegant', 'grand'] },
  { char: '雪', meaning: '白雪，纯洁', source: '柳宗元《江雪》', sourceDetail: '孤舟蓑笠翁，独钓寒江雪。', gender: 'f', tags: ['poetic', 'elegant'] },
  { char: '松', meaning: '青松，坚韧', source: '《论语·子罕》', sourceDetail: '岁寒，然后知松柏之后凋也。', gender: 'm', tags: ['grand', 'classic', 'poetic'] },
  { char: '竹', meaning: '竹子，虚心', source: '苏轼《於潜僧绿筠轩》', sourceDetail: '宁可食无肉，不可居无竹。', gender: 'n', tags: ['elegant', 'poetic', 'classic'] },
  { char: '梅', meaning: '梅花，傲骨', source: '王安石《梅花》', sourceDetail: '遥知不是雪，为有暗香来。', gender: 'f', tags: ['poetic', 'elegant'] },
  { char: '兰', meaning: '兰花，高洁', source: '《孔子家语》', sourceDetail: '与善人居，如入芝兰之室。', gender: 'f', tags: ['elegant', 'poetic', 'classic'] },
  { char: '荷', meaning: '荷花，出淤泥而不染', source: '周敦颐《爱莲说》', sourceDetail: '出淤泥而不染，濯清涟而不妖。', gender: 'f', tags: ['elegant', 'poetic'] },
  { char: '溪', meaning: '溪流，清澈', source: '王维《青溪》', sourceDetail: '言入黄花川，每逐青溪水。', gender: 'f', tags: ['poetic', 'elegant'] },
  { char: '岚', meaning: '山间雾气，缥缈', source: '王维《送方尊师归嵩山》', sourceDetail: '瀑布杉松常带雨，夕阳彩翠忽成岚。', gender: 'f', tags: ['poetic', 'elegant'] },
  { char: '霜', meaning: '秋霜，高洁', source: '杜甫《月夜忆舍弟》', sourceDetail: '露从今夜白，月是故乡明。', gender: 'n', tags: ['poetic', 'elegant', 'classic'] },
  { char: '岳', meaning: '高山，巍峨', source: '《诗经·大雅》', sourceDetail: '崧高维岳，骏极于天。', gender: 'm', tags: ['grand', 'classic'] },
  { char: '泽', meaning: '恩泽，润泽', source: '《孟子·离娄下》', sourceDetail: '泽畔行吟处，天地一沙鸥。', gender: 'm', tags: ['grand', 'elegant', 'poetic'] },
  { char: '林', meaning: '树林，茂盛', source: '陶渊明《归园田居》', sourceDetail: '羁鸟恋旧林，池鱼思故渊。', gender: 'n', tags: ['poetic', 'elegant', 'classic'] },
  { char: '泉', meaning: '清泉，源头', source: '王维《山居秋暝》', sourceDetail: '明月松间照，清泉石上流。', gender: 'n', tags: ['poetic', 'elegant'] },
  { char: '海', meaning: '大海，广阔', source: '曹操《观沧海》', sourceDetail: '日月之行，若出其中；星汉灿烂，若出其里。', gender: 'm', tags: ['grand', 'poetic'] },
  { char: '江', meaning: '江河，壮阔', source: '苏轼《念奴娇》', sourceDetail: '大江东去，浪淘尽，千古风流人物。', gender: 'm', tags: ['grand', 'poetic'] },
  { char: '峰', meaning: '山峰，巅峰', source: '杜甫《望岳》', sourceDetail: '会当凌绝顶，一览众山小。', gender: 'm', tags: ['grand', 'poetic'] },
  { char: '岩', meaning: '岩石，坚固', source: '《诗经·小雅》', sourceDetail: '节彼南山，维石岩岩。', gender: 'm', tags: ['grand', 'classic'] },
  { char: '柏', meaning: '柏树，长青', source: '《论语·子罕》', sourceDetail: '岁寒，然后知松柏之后凋也。', gender: 'm', tags: ['grand', 'classic', 'poetic'] },
  { char: '梧', meaning: '梧桐，高洁', source: '《诗经·大雅》', sourceDetail: '凤凰鸣矣，于彼高冈。梧桐生矣，于彼朝阳。', gender: 'n', tags: ['poetic', 'elegant'] },
  { char: '棠', meaning: '海棠，美好', source: '《诗经·召南》', sourceDetail: '蔽芾甘棠，勿翦勿伐。', gender: 'f', tags: ['poetic', 'elegant'] },
  { char: '露', meaning: '露珠，纯净', source: '曹操《短歌行》', sourceDetail: '譬如朝露，去日苦多。', gender: 'f', tags: ['poetic', 'elegant'] },
  { char: '烟', meaning: '烟霞，缥缈', source: '崔颢《黄鹤楼》', sourceDetail: '日暮乡关何处是？烟波江上使人愁。', gender: 'f', tags: ['poetic'] },
  { char: '霞', meaning: '彩霞，绚烂', source: '王勃《滕王阁序》', sourceDetail: '落霞与孤鹜齐飞，秋水共长天一色。', gender: 'f', tags: ['poetic', 'elegant'] },
  { char: '雨', meaning: '春雨，润物', source: '杜甫《春夜喜雨》', sourceDetail: '好雨知时节，当春乃发生。', gender: 'n', tags: ['poetic', 'elegant'] },
  { char: '晴', meaning: '晴朗，明媚', source: '刘禹锡《竹枝词》', sourceDetail: '东边日出西边雨，道是无晴却有晴。', gender: 'f', tags: ['poetic', 'elegant'] },
  { char: '春', meaning: '春天，生机', source: '孟浩然《春晓》', sourceDetail: '春眠不觉晓，处处闻啼鸟。', gender: 'n', tags: ['poetic', 'elegant', 'grand'] },
  { char: '秋', meaning: '秋天，收获', source: '刘禹锡《秋词》', sourceDetail: '自古逢秋悲寂寥，我言秋日胜春朝。', gender: 'n', tags: ['poetic', 'elegant'] },

  // ── 才学智慧 Wisdom ──
  { char: '文', meaning: '文学，文采', source: '《论语·学而》', sourceDetail: '行有余力，则以学文。', gender: 'n', tags: ['elegant', 'classic', 'grand'] },
  { char: '思', meaning: '思考，深思', source: '《论语·为政》', sourceDetail: '学而不思则罔，思而不学则殆。', gender: 'n', tags: ['elegant', 'poetic', 'classic'] },
  { char: '知', meaning: '知识，通达', source: '《论语·为政》', sourceDetail: '知之为知之，不知为不知，是知也。', gender: 'n', tags: ['elegant', 'classic'] },
  { char: '明', meaning: '明亮，明理', source: '《大学》', sourceDetail: '大学之道，在明明德。', gender: 'm', tags: ['grand', 'elegant', 'classic'] },
  { char: '哲', meaning: '哲理，明智', source: '《诗经·大雅》', sourceDetail: '既明且哲，以保其身。', gender: 'm', tags: ['elegant', 'grand', 'classic'] },
  { char: '慧', meaning: '智慧，聪慧', source: '《世说新语》', sourceDetail: '谢道韫：未若柳絮因风起。', gender: 'f', tags: ['elegant', 'poetic'] },
  { char: '敏', meaning: '敏捷，聪敏', source: '《论语·公冶长》', sourceDetail: '敏而好学，不耻下问。', gender: 'n', tags: ['elegant', 'classic'] },
  { char: '博', meaning: '博学，广博', source: '《中庸》', sourceDetail: '博学之，审问之，慎思之，明辨之，笃行之。', gender: 'm', tags: ['grand', 'elegant', 'classic'] },
  { char: '达', meaning: '通达，豁达', source: '《论语·雍也》', sourceDetail: '己欲立而立人，己欲达而达人。', gender: 'm', tags: ['grand', 'elegant'] },
  { char: '睿', meaning: '睿智，通达', source: '《尚书·洪范》', sourceDetail: '思曰睿，睿作圣。', gender: 'm', tags: ['grand', 'elegant', 'classic'] },
  { char: '悟', meaning: '领悟，觉悟', source: '《六祖坛经》', sourceDetail: '菩提本无树，明镜亦非台。', gender: 'n', tags: ['elegant', 'poetic', 'classic'] },
  { char: '书', meaning: '书香，学问', source: '苏轼《和董传留别》', sourceDetail: '粗缯大布裹生涯，腹有诗书气自华。', gender: 'n', tags: ['elegant', 'poetic', 'classic'] },
  { char: '学', meaning: '学习，学问', source: '《论语·学而》', sourceDetail: '学而时习之，不亦说乎？', gender: 'm', tags: ['classic', 'elegant'] },
  { char: '翰', meaning: '文翰，才华', source: '《诗经·小雅》', sourceDetail: '宛彼鸣鸠，翰飞戾天。', gender: 'm', tags: ['elegant', 'grand', 'poetic'] },
  { char: '儒', meaning: '儒雅，学者', source: '《论语·雍也》', sourceDetail: '女为君子儒，无为小人儒。', gender: 'm', tags: ['classic', 'elegant'] },
  { char: '修', meaning: '修身，修养', source: '《大学》', sourceDetail: '自天子以至于庶人，壹是皆以修身为本。', gender: 'm', tags: ['classic', 'elegant', 'grand'] },
  { char: '省', meaning: '反省，自省', source: '《论语·里仁》', sourceDetail: '见贤思齐焉，见不贤而内自省也。', gender: 'n', tags: ['classic', 'elegant'] },
  { char: '鉴', meaning: '借鉴，明鉴', source: '《诗经·大雅》', sourceDetail: '殷鉴不远，在夏后之世。', gender: 'm', tags: ['classic', 'grand'] },
  { char: '赋', meaning: '天赋，才华', source: '《楚辞》', sourceDetail: '纷吾既有此内美兮，又重之以修能。', gender: 'm', tags: ['poetic', 'elegant'] },
  { char: '韵', meaning: '韵味，风韵', source: '刘勰《文心雕龙》', sourceDetail: '异音相从谓之和，同声相应谓之韵。', gender: 'f', tags: ['elegant', 'poetic'] },

  // ── 志向抱负 Aspiration ──
  { char: '志', meaning: '志向，意志', source: '《论语·里仁》', sourceDetail: '士志于道，而耻恶衣恶食者，未足与议也。', gender: 'm', tags: ['grand', 'classic'] },
  { char: '远', meaning: '高远，深远', source: '诸葛亮《诫子书》', sourceDetail: '非淡泊无以明志，非宁静无以致远。', gender: 'm', tags: ['grand', 'poetic', 'elegant'] },
  { char: '宏', meaning: '宏大，宏伟', source: '《尚书·大禹谟》', sourceDetail: '人心惟危，道心惟微，惟精惟一，允执厥中。', gender: 'm', tags: ['grand', 'classic'] },
  { char: '鹏', meaning: '大鹏，壮志', source: '《庄子·逍遥游》', sourceDetail: '鹏之徙于南冥也，水击三千里，抟扶摇而上者九万里。', gender: 'm', tags: ['grand', 'poetic'] },
  { char: '凌', meaning: '凌云，超越', source: '杜甫《望岳》', sourceDetail: '会当凌绝顶，一览众山小。', gender: 'm', tags: ['grand', 'poetic', 'elegant'] },
  { char: '霄', meaning: '云霄，高远', source: '王勃《滕王阁序》', sourceDetail: '落霞与孤鹜齐飞，秋水共长天一色。', gender: 'm', tags: ['grand', 'poetic'] },
  { char: '鸿', meaning: '鸿鹄，大志', source: '《史记·陈涉世家》', sourceDetail: '燕雀安知鸿鹄之志哉！', gender: 'm', tags: ['grand', 'poetic'] },
  { char: '骏', meaning: '骏马，才能出众', source: '《诗经·小雅》', sourceDetail: '皎皎白驹，在彼空谷。', gender: 'm', tags: ['grand', 'poetic'] },
  { char: '翔', meaning: '翱翔，自由', source: '《诗经·大雅》', sourceDetail: '凤凰鸣矣，于彼高冈。', gender: 'm', tags: ['grand', 'poetic', 'elegant'] },
  { char: '飞', meaning: '飞翔，超越', source: '《诗经·大雅》', sourceDetail: '凤凰于飞，翙翙其羽。', gender: 'm', tags: ['grand', 'poetic'] },
  { char: '腾', meaning: '腾飞，奋起', source: '《庄子·逍遥游》', sourceDetail: '抟扶摇而上者九万里。', gender: 'm', tags: ['grand'] },
  { char: '昂', meaning: '昂扬，气宇轩昂', source: '《诗经·大雅》', sourceDetail: '颙颙卬卬，如圭如璋。', gender: 'm', tags: ['grand', 'poetic'] },
  { char: '勋', meaning: '功勋，成就', source: '《尚书·大禹谟》', sourceDetail: '其克有勋。', gender: 'm', tags: ['grand', 'classic'] },
  { char: '冠', meaning: '冠军，出众', source: '《史记》', sourceDetail: '勇冠三军。', gender: 'm', tags: ['grand'] },
  { char: '栋', meaning: '栋梁，担当', source: '《国语》', sourceDetail: '栋梁之材。', gender: 'm', tags: ['grand', 'classic'] },
  { char: '鼎', meaning: '鼎盛，尊贵', source: '《周易·鼎卦》', sourceDetail: '鼎，元吉，亨。', gender: 'm', tags: ['grand', 'classic'] },

  // ── 美好品质 Beauty ──
  { char: '雅', meaning: '优雅，高雅', source: '《诗经》', sourceDetail: '风雅颂——《诗经》三体。', gender: 'f', tags: ['elegant', 'poetic', 'classic'] },
  { char: '清', meaning: '清雅，清正', source: '屈原《渔父》', sourceDetail: '举世皆浊我独清，众人皆醉我独醒。', gender: 'n', tags: ['elegant', 'poetic', 'classic'] },
  { char: '润', meaning: '温润，润泽', source: '《论语·宪问》', sourceDetail: '为命，裨谌草创之，世叔讨论之，行人子羽修饰之。', gender: 'n', tags: ['elegant', 'classic'] },
  { char: '涵', meaning: '涵养，包容', source: '《孟子·公孙丑上》', sourceDetail: '我善养吾浩然之气。', gender: 'f', tags: ['elegant', 'poetic'] },
  { char: '澄', meaning: '澄澈，清明', source: '王维《青溪》', sourceDetail: '漾漾泛菱荇，澄澄映葭苇。', gender: 'n', tags: ['elegant', 'poetic'] },
  { char: '熙', meaning: '光明，兴盛', source: '《诗经·周颂》', sourceDetail: '维清缉熙，文王之典。', gender: 'n', tags: ['grand', 'elegant', 'poetic'] },
  { char: '煜', meaning: '光辉，明亮', source: '《太玄·元告》', sourceDetail: '日以煜乎昼，月以煜乎夜。', gender: 'm', tags: ['grand', 'elegant'] },
  { char: '瑾', meaning: '美玉，品德高洁', source: '《楚辞·九章》', sourceDetail: '怀瑾握瑜兮，穷不知所示。', gender: 'f', tags: ['elegant', 'poetic', 'classic'] },
  { char: '瑜', meaning: '美玉，优点', source: '《楚辞·九章》', sourceDetail: '怀瑾握瑜兮。', gender: 'n', tags: ['elegant', 'poetic'] },
  { char: '瑶', meaning: '美玉，美好', source: '《诗经·卫风》', sourceDetail: '投我以木桃，报之以琼瑶。', gender: 'f', tags: ['elegant', 'poetic'] },
  { char: '琪', meaning: '美玉，珍奇', source: '《穆天子传》', sourceDetail: '璿弁玉缨，琪花瑶草。', gender: 'f', tags: ['elegant', 'poetic'] },
  { char: '婉', meaning: '温婉，柔美', source: '《诗经·郑风》', sourceDetail: '有美一人，清扬婉兮。', gender: 'f', tags: ['elegant', 'poetic'] },
  { char: '灵', meaning: '灵动，聪灵', source: '《诗经·大雅》', sourceDetail: '惟岳降神，生甫及申。', gender: 'f', tags: ['poetic', 'elegant'] },
  { char: '颖', meaning: '聪颖，出众', source: '《南史·谢灵运传》', sourceDetail: '灵运幼便颖悟。', gender: 'f', tags: ['elegant', 'poetic'] },
  { char: '悠', meaning: '悠远，从容', source: '《诗经·关雎》', sourceDetail: '悠哉悠哉，辗转反侧。', gender: 'n', tags: ['poetic', 'elegant'] },
  { char: '逸', meaning: '飘逸，超脱', source: '李白《月下独酌》', sourceDetail: '永结无情游，相期邈云汉。', gender: 'm', tags: ['poetic', 'elegant'] },
  { char: '辰', meaning: '星辰，时辰', source: '《诗经·小雅》', sourceDetail: '天之生我，我辰安在？', gender: 'n', tags: ['poetic', 'grand', 'elegant'] },
  { char: '璟', meaning: '玉的光彩', source: '《广韵》', sourceDetail: '璟，玉光也。', gender: 'n', tags: ['elegant', 'poetic'] },
  { char: '昊', meaning: '天空，广大', source: '《诗经·小雅》', sourceDetail: '昊天曰明，及尔出王。', gender: 'm', tags: ['grand', 'poetic'] },
  { char: '恒', meaning: '恒久，持久', source: '《周易·恒卦》', sourceDetail: '天地之道，恒久而不已也。', gender: 'm', tags: ['classic', 'grand'] },
  { char: '言', meaning: '言语，言论', source: '《论语·里仁》', sourceDetail: '君子欲讷于言而敏于行。', gender: 'n', tags: ['elegant', 'classic', 'poetic'] },
  { char: '之', meaning: '助词，文雅', source: '《论语》', sourceDetail: '学而时习之，不亦说乎？', gender: 'n', tags: ['classic', 'elegant', 'poetic'] },
  { char: '予', meaning: '给予，我', source: '《诗经·小雅》', sourceDetail: '将母来谂，以慰予心。', gender: 'n', tags: ['elegant', 'poetic', 'classic'] },
  { char: '亦', meaning: '也，同样', source: '《论语·学而》', sourceDetail: '学而时习之，不亦说乎？', gender: 'n', tags: ['classic', 'elegant', 'poetic'] },
  { char: '欣', meaning: '欣喜，快乐', source: '陶渊明《归去来兮辞》', sourceDetail: '木欣欣以向荣，泉涓涓而始流。', gender: 'f', tags: ['poetic', 'elegant'] },
  { char: '悦', meaning: '喜悦，愉悦', source: '《论语·学而》', sourceDetail: '有朋自远方来，不亦乐乎？', gender: 'f', tags: ['elegant', 'poetic'] },
  { char: '宁', meaning: '安宁，宁静', source: '诸葛亮《诫子书》', sourceDetail: '非宁静无以致远。', gender: 'n', tags: ['elegant', 'classic', 'poetic'] },
  { char: '舒', meaning: '舒展，从容', source: '《诗经·陈风》', sourceDetail: '月出皎兮，佼人僚兮。舒窈纠兮。', gender: 'f', tags: ['elegant', 'poetic'] },
  { char: '妍', meaning: '美丽，美好', source: '《诗经·卫风》', sourceDetail: '巧笑倩兮，美目盼兮。', gender: 'f', tags: ['elegant', 'poetic'] },
  { char: '姝', meaning: '美丽，美好', source: '《诗经·邶风》', sourceDetail: '静女其姝，俟我于城隅。', gender: 'f', tags: ['elegant', 'poetic', 'classic'] },
  { char: '嫣', meaning: '美好，笑容', source: '《楚辞》', sourceDetail: '嫣然一笑。', gender: 'f', tags: ['poetic', 'elegant'] },
  { char: '彤', meaning: '红色，美好', source: '《诗经·邶风》', sourceDetail: '彤管有炜，说怿女美。', gender: 'f', tags: ['poetic', 'elegant'] },
  { char: '素', meaning: '素雅，质朴', source: '《论语·八佾》', sourceDetail: '绘事后素。', gender: 'f', tags: ['elegant', 'classic', 'poetic'] },
  { char: '琳', meaning: '美玉，美好', source: '《尔雅》', sourceDetail: '琳，美玉也。', gender: 'f', tags: ['elegant', 'poetic'] },
  { char: '萱', meaning: '萱草，忘忧', source: '《诗经·卫风》', sourceDetail: '焉得谖草，言树之背。', gender: 'f', tags: ['elegant', 'poetic'] },
  { char: '蕊', meaning: '花蕊，美好', source: '黄巢《题菊花》', sourceDetail: '飒飒西风满院栽，蕊寒香冷蝶难来。', gender: 'f', tags: ['poetic', 'elegant'] },
  { char: '漪', meaning: '水波，涟漪', source: '《诗经·魏风》', sourceDetail: '河水清且涟猗。', gender: 'f', tags: ['poetic', 'elegant'] },
  { char: '然', meaning: '自然，坦然', source: '《论语·雍也》', sourceDetail: '知者乐水，仁者乐山。知者动，仁者静。', gender: 'n', tags: ['elegant', 'classic', 'poetic'] },
  { char: '安', meaning: '安定，平安', source: '《论语·学而》', sourceDetail: '不患人之不己知，患不知人也。', gender: 'n', tags: ['elegant', 'classic'] },
  { char: '平', meaning: '平和，公正', source: '《论语·雍也》', sourceDetail: '中庸之为德也，其至矣乎！', gender: 'n', tags: ['classic', 'elegant'] },
  { char: '嘉', meaning: '美好，赞许', source: '《诗经·大雅》', sourceDetail: '嘉乐君子，宪宪令德。', gender: 'n', tags: ['elegant', 'grand', 'poetic'] },
  { char: '懿', meaning: '美好，德行', source: '《诗经·大雅》', sourceDetail: '懿德。', gender: 'f', tags: ['elegant', 'classic'] },
  { char: '昭', meaning: '光明，显著', source: '《诗经·大雅》', sourceDetail: '于昭于天。', gender: 'n', tags: ['grand', 'elegant', 'classic'] },
  { char: '晔', meaning: '光辉灿烂', source: '《说文》', sourceDetail: '晔，光也。', gender: 'm', tags: ['grand', 'elegant'] },
  { char: '晖', meaning: '阳光，光辉', source: '孟浩然《望洞庭湖赠张丞相》', sourceDetail: '气蒸云梦泽，波撼岳阳城。', gender: 'n', tags: ['poetic', 'elegant', 'grand'] },
  { char: '晨', meaning: '早晨，朝气', source: '《诗经·小雅》', sourceDetail: '夜如何其？夜乡晨。', gender: 'n', tags: ['poetic', 'elegant'] },
  { char: '昕', meaning: '黎明，光明', source: '《说文》', sourceDetail: '昕，旦明也。', gender: 'f', tags: ['elegant', 'poetic'] },
  { char: '曦', meaning: '晨光，朝阳', source: '《诗经·小雅》', sourceDetail: '湛湛露斯，匪阳不晞。', gender: 'f', tags: ['poetic', 'elegant'] },
  { char: '奕', meaning: '盛大，光明', source: '《诗经·大雅》', sourceDetail: '奕奕梁山，维禹甸之。', gender: 'm', tags: ['grand', 'elegant'] },
  { char: '宸', meaning: '帝王，尊贵', source: '《论语》', sourceDetail: '为政以德，譬如北辰。', gender: 'm', tags: ['grand', 'elegant'] },
  { char: '渊', meaning: '深远，渊博', source: '《庄子》', sourceDetail: '渊默而雷声。', gender: 'm', tags: ['grand', 'elegant', 'classic'] },
  { char: '淳', meaning: '淳朴，厚道', source: '《论语·学而》', sourceDetail: '巧言令色，鲜矣仁。', gender: 'm', tags: ['classic', 'elegant'] },
  { char: '澈', meaning: '清澈，透彻', source: '王维《青溪》', sourceDetail: '漾漾泛菱荇，澄澄映葭苇。', gender: 'n', tags: ['elegant', 'poetic'] },

  // ── 出自《尚书》《礼记》《左传》 ──
  { char: '典', meaning: '经典，法则', source: '《尚书·舜典》', sourceDetail: '慎徽五典，五典克从。', gender: 'm', tags: ['classic', 'grand'] },
  { char: '谟', meaning: '谋略，谋划', source: '《尚书·大禹谟》', sourceDetail: '大禹谟。', gender: 'm', tags: ['classic', 'grand'] },
  { char: '章', meaning: '文章，法度', source: '《尚书·尧典》', sourceDetail: '天秩有礼，自我五礼有庸哉。', gender: 'm', tags: ['classic', 'elegant'] },
  { char: '雍', meaning: '和谐，雍容', source: '《尚书·尧典》', sourceDetail: '黎民于变时雍。', gender: 'm', tags: ['classic', 'elegant'] },
  { char: '穆', meaning: '肃穆，庄重', source: '《诗经·大雅》', sourceDetail: '穆穆文王，于缉熙敬止。', gender: 'm', tags: ['classic', 'grand'] },
  { char: '熙', meaning: '光明，兴盛', source: '《诗经·周颂》', sourceDetail: '维清缉熙，文王之典。', gender: 'n', tags: ['grand', 'elegant', 'poetic'] },
  { char: '肃', meaning: '严肃，庄敬', source: '《礼记·曲礼》', sourceDetail: '毋不敬，俨若思。', gender: 'm', tags: ['classic', 'grand'] },
  { char: '恪', meaning: '恭敬，谨慎', source: '《礼记·祭义》', sourceDetail: '致礼以治躬则庄敬。', gender: 'm', tags: ['classic', 'elegant'] },
  { char: '温', meaning: '温和，温良', source: '《论语·学而》', sourceDetail: '夫子温良恭俭让以得之。', gender: 'n', tags: ['elegant', 'classic'] },
  { char: '俭', meaning: '节俭，朴素', source: '《论语·学而》', sourceDetail: '夫子温良恭俭让以得之。', gender: 'm', tags: ['classic'] },
  { char: '让', meaning: '谦让，礼让', source: '《论语·学而》', sourceDetail: '夫子温良恭俭让以得之。', gender: 'm', tags: ['classic', 'elegant'] },
  { char: '惠', meaning: '仁惠，恩惠', source: '《论语·公冶长》', sourceDetail: '其养民也惠。', gender: 'f', tags: ['elegant', 'classic'] },
  { char: '昭', meaning: '光明，显著', source: '《左传·定公四年》', sourceDetail: '以昭周公之明德。', gender: 'n', tags: ['grand', 'elegant', 'classic'] },
  { char: '烈', meaning: '光明，功业', source: '《左传·宣公十二年》', sourceDetail: '武有七德。', gender: 'm', tags: ['grand', 'classic'] },
  { char: '宪', meaning: '法度，典范', source: '《诗经·大雅》', sourceDetail: '嘉乐君子，宪宪令德。', gender: 'm', tags: ['classic', 'grand'] },
  { char: '令', meaning: '美好，善', source: '《诗经·大雅》', sourceDetail: '嘉乐君子，宪宪令德。', gender: 'n', tags: ['elegant', 'classic'] },
  { char: '攸', meaning: '所，长远', source: '《诗经·大雅》', sourceDetail: '君子有酒，嘉宾式燕绥之。', gender: 'n', tags: ['classic', 'elegant'] },
  { char: '绥', meaning: '安抚，安宁', source: '《诗经·大雅》', sourceDetail: '君子有酒，嘉宾式燕绥之。', gender: 'm', tags: ['classic', 'elegant'] },

  // ── 出自《庄子》《老子》《墨子》 ──
  { char: '逍', meaning: '逍遥，自在', source: '《庄子·逍遥游》', sourceDetail: '逍遥游。', gender: 'm', tags: ['poetic', 'elegant'] },
  { char: '遥', meaning: '遥远，逍遥', source: '《庄子·逍遥游》', sourceDetail: '逍遥游。', gender: 'n', tags: ['poetic', 'elegant'] },
  { char: '鲲', meaning: '大鱼，壮志', source: '《庄子·逍遥游》', sourceDetail: '北冥有鱼，其名为鲲。', gender: 'm', tags: ['grand', 'poetic'] },
  { char: '朴', meaning: '朴素，本真', source: '《道德经》', sourceDetail: '见素抱朴，少私寡欲。', gender: 'n', tags: ['classic', 'elegant'] },
  { char: '玄', meaning: '深奥，玄妙', source: '《道德经》', sourceDetail: '玄之又玄，众妙之门。', gender: 'm', tags: ['classic', 'grand'] },
  { char: '妙', meaning: '美妙，奥妙', source: '《道德经》', sourceDetail: '玄之又玄，众妙之门。', gender: 'f', tags: ['elegant', 'poetic'] },
  { char: '谷', meaning: '山谷，虚怀', source: '《道德经》', sourceDetail: '知其雄，守其雌，为天下谿。', gender: 'n', tags: ['classic', 'poetic'] },
  { char: '慈', meaning: '慈爱，仁慈', source: '《道德经》', sourceDetail: '我有三宝，持而保之：一曰慈，二曰俭，三曰不敢为天下先。', gender: 'f', tags: ['classic', 'elegant'] },
  { char: '俭', meaning: '节俭，朴素', source: '《道德经》', sourceDetail: '我有三宝，持而保之：一曰慈，二曰俭。', gender: 'm', tags: ['classic'] },
  { char: '兼', meaning: '兼爱，包容', source: '《墨子·兼爱》', sourceDetail: '兼相爱，交相利。', gender: 'm', tags: ['classic', 'grand'] },
  { char: '非', meaning: '非凡，不凡', source: '《韩非子》', sourceDetail: '非。', gender: 'm', tags: ['grand'] },

  // ── 出自《世说新语》《文心雕龙》 ──
  { char: '朗', meaning: '开朗，明亮', source: '《世说新语》', sourceDetail: '朗朗如日月之入怀。', gender: 'm', tags: ['elegant', 'poetic'] },
  { char: '韶', meaning: '美好，韶华', source: '《世说新语》', sourceDetail: '韶音令辞。', gender: 'n', tags: ['elegant', 'poetic'] },
  { char: '蔚', meaning: '文采繁盛', source: '《文心雕龙》', sourceDetail: '蔚彼风力。', gender: 'n', tags: ['elegant', 'poetic'] },
  { char: '彬', meaning: '文质兼备', source: '《论语·雍也》', sourceDetail: '文质彬彬，然后君子。', gender: 'm', tags: ['elegant', 'classic'] },
  { char: '炳', meaning: '光明，显著', source: '《文心雕龙》', sourceDetail: '炳耀仁孝。', gender: 'm', tags: ['grand', 'elegant'] },
  { char: '焕', meaning: '光明，焕发', source: '《文心雕龙》', sourceDetail: '焕乎其有文章。', gender: 'm', tags: ['grand', 'elegant'] },
  { char: '斐', meaning: '有文采', source: '《论语·公冶长》', sourceDetail: '斐然成章。', gender: 'n', tags: ['elegant', 'poetic'] },

  // ── 出自唐宋诗词补遗 ──
  { char: '疏', meaning: '疏朗，洒脱', source: '苏轼《卜算子》', sourceDetail: '缺月挂疏桐。', gender: 'n', tags: ['poetic', 'elegant'] },
  { char: '澹', meaning: '恬淡，澹泊', source: '诸葛亮《诫子书》', sourceDetail: '非澹泊无以明志。', gender: 'n', tags: ['elegant', 'poetic', 'classic'] },
  { char: '萧', meaning: '萧洒，超脱', source: '王维《山居秋暝》', sourceDetail: '竹喧归浣女，莲动下渔舟。', gender: 'm', tags: ['poetic', 'elegant'] },
  { char: '鸿', meaning: '鸿雁，大志', source: '苏轼《和子由渑池怀旧》', sourceDetail: '人生到处知何似，应似飞鸿踏雪泥。', gender: 'm', tags: ['grand', 'poetic'] },
  { char: '渡', meaning: '渡越，超越', source: '韦应物《滁州西涧》', sourceDetail: '春潮带雨晚来急，野渡无人舟自横。', gender: 'm', tags: ['poetic'] },
  { char: '隐', meaning: '隐逸，超然', source: '陶渊明《归去来兮辞》', sourceDetail: '归去来兮！田园将芜胡不归？', gender: 'm', tags: ['poetic', 'elegant'] },
  { char: '归', meaning: '回归，归真', source: '陶渊明《归去来兮辞》', sourceDetail: '归去来兮！', gender: 'n', tags: ['poetic', 'classic'] },
  { char: '素', meaning: '素雅，质朴', source: '《论语·八佾》', sourceDetail: '绘事后素。', gender: 'f', tags: ['elegant', 'classic', 'poetic'] },
  { char: '墨', meaning: '文墨，书香', source: '《文心雕龙》', sourceDetail: '墨彩腾奋。', gender: 'n', tags: ['elegant', 'poetic'] },
  { char: '砚', meaning: '砚台，文雅', source: '文房四宝。', sourceDetail: '笔墨纸砚。', gender: 'm', tags: ['elegant', 'classic'] },
  { char: '弦', meaning: '琴弦，雅致', source: '《诗经·关雎》', sourceDetail: '窈窕淑女，琴瑟友之。', gender: 'n', tags: ['elegant', 'poetic'] },
  { char: '瑟', meaning: '琴瑟，和谐', source: '《诗经·关雎》', sourceDetail: '窈窕淑女，琴瑟友之。', gender: 'n', tags: ['elegant', 'poetic'] },
  { char: '锦', meaning: '锦绣，华美', source: '李商隐《锦瑟》', sourceDetail: '锦瑟无端五十弦，一弦一柱思华年。', gender: 'n', tags: ['elegant', 'poetic'] },
  { char: '绮', meaning: '绮丽，华美', source: '《古诗十九首》', sourceDetail: '客从远方来，遗我一端绮。', gender: 'f', tags: ['elegant', 'poetic'] },
  { char: '凝', meaning: '凝练，专注', source: '柳永《雨霖铃》', sourceDetail: '执手相看泪眼，竟无语凝噎。', gender: 'f', tags: ['poetic', 'elegant'] },
  { char: '渡', meaning: '渡越，超越', source: '韦应物《滁州西涧》', sourceDetail: '春潮带雨晚来急，野渡无人舟自横。', gender: 'm', tags: ['poetic'] },
  { char: '吟', meaning: '吟咏，诗意', source: '屈原《渔父》', sourceDetail: '屈原既放，游于江潭，行吟泽畔。', gender: 'n', tags: ['poetic', 'elegant'] },
  { char: '咏', meaning: '歌咏，抒怀', source: '《诗经·关雎》', sourceDetail: '咏歌之不足。', gender: 'n', tags: ['poetic', 'elegant'] },
  { char: '翎', meaning: '羽毛，轻盈', source: '杜甫《春望》', sourceDetail: '感时花溅泪，恨别鸟惊心。', gender: 'n', tags: ['poetic', 'elegant'] },
  { char: '翎', meaning: '羽翎，高飞', source: '《说文》', sourceDetail: '翎，羽也。', gender: 'n', tags: ['poetic', 'elegant'] },
  { char: '砚', meaning: '砚台，文雅', source: '文房四宝。', sourceDetail: '笔墨纸砚。', gender: 'm', tags: ['elegant', 'classic'] },

  // ── 更多补遗 ──
  { char: '霆', meaning: '雷霆，威猛', source: '《诗经·大雅》', sourceDetail: '如雷如霆。', gender: 'm', tags: ['grand'] },
  { char: '昂', meaning: '昂扬，气宇轩昂', source: '《诗经·大雅》', sourceDetail: '颙颙卬卬。', gender: 'm', tags: ['grand', 'poetic'] },
  { char: '翰', meaning: '文翰，高飞', source: '《诗经·小雅》', sourceDetail: '宛彼鸣鸠，翰飞戾天。', gender: 'm', tags: ['elegant', 'grand', 'poetic'] },
  { char: '霄', meaning: '云霄，高远', source: '王勃《滕王阁序》', sourceDetail: '落霞与孤鹜齐飞。', gender: 'm', tags: ['grand', 'poetic'] },
  { char: '鸿', meaning: '鸿鹄，大志', source: '《史记》', sourceDetail: '燕雀安知鸿鹄之志哉！', gender: 'm', tags: ['grand', 'poetic'] },
  { char: '澜', meaning: '波澜，壮阔', source: '《孟子·尽心上》', sourceDetail: '观水有术，必观其澜。', gender: 'n', tags: ['grand', 'poetic'] },
  { char: '潇', meaning: '潇洒，超脱', source: '苏轼《定风波》', sourceDetail: '一蓑烟雨任平生。', gender: 'n', tags: ['poetic', 'elegant'] },
  { char: '澄', meaning: '澄澈，清明', source: '王维《青溪》', sourceDetail: '漾漾泛菱荇，澄澄映葭苇。', gender: 'n', tags: ['elegant', 'poetic'] },
  { char: '澈', meaning: '清澈，透彻', source: '王维《青溪》', sourceDetail: '漾漾泛菱荇，澄澄映葭苇。', gender: 'n', tags: ['elegant', 'poetic'] },
  { char: '澈', meaning: '清澈', source: '《说文》', sourceDetail: '澈，水清也。', gender: 'n', tags: ['elegant', 'poetic'] },
  { char: '泓', meaning: '水深而广', source: '《说文》', sourceDetail: '泓，下深大也。', gender: 'n', tags: ['elegant', 'poetic'] },
  { char: '沛', meaning: '充沛，旺盛', source: '《孟子》', sourceDetail: '沛然德教。', gender: 'm', tags: ['grand'] },
  { char: '濯', meaning: '洗涤，清濯', source: '《楚辞·渔父》', sourceDetail: '沧浪之水清兮，可以濯吾缨。', gender: 'm', tags: ['poetic', 'classic'] },
  { char: '缨', meaning: '冠缨，高洁', source: '《楚辞·渔父》', sourceDetail: '沧浪之水清兮，可以濯吾缨。', gender: 'm', tags: ['classic', 'elegant'] },
  { char: '澜', meaning: '波澜', source: '《孟子》', sourceDetail: '观水有术，必观其澜。', gender: 'n', tags: ['grand', 'poetic'] },
  { char: '澄', meaning: '澄明', source: '谢朓诗', sourceDetail: '澄江静如练。', gender: 'n', tags: ['elegant', 'poetic'] },
  { char: '璞', meaning: '璞玉，未雕琢的玉', source: '《韩非子》', sourceDetail: '和氏之璧。', gender: 'm', tags: ['elegant', 'classic'] },
  { char: '砺', meaning: '磨砺，砥砺', source: '《荀子》', sourceDetail: '金就砺则利。', gender: 'm', tags: ['classic', 'grand'] },
  { char: '砥', meaning: '砥砺，磨练', source: '《荀子》', sourceDetail: '砥砺。', gender: 'm', tags: ['classic', 'grand'] },
  { char: '钧', meaning: '重量单位，重要', source: '《孟子》', sourceDetail: '吾力足以举百钧。', gender: 'm', tags: ['grand', 'classic'] },
  { char: '铨', meaning: '衡量，选拔', source: '《说文》', sourceDetail: '铨，衡也。', gender: 'm', tags: ['classic', 'elegant'] },
  { char: '铸', meaning: '铸造，锤炼', source: '《左传》', sourceDetail: '铸鼎象物。', gender: 'm', tags: ['grand', 'classic'] },
  { char: '鉴', meaning: '明鉴，借鉴', source: '《诗经·大雅》', sourceDetail: '殷鉴不远。', gender: 'm', tags: ['classic', 'grand'] },
  { char: '铎', meaning: '大铃，教化', source: '《论语》', sourceDetail: '天将以夫子为木铎。', gender: 'm', tags: ['classic', 'grand'] },
  { char: '笙', meaning: '笙簧，雅乐', source: '《诗经·小雅》', sourceDetail: '鼓瑟鼓琴，笙磬同音。', gender: 'n', tags: ['elegant', 'poetic'] },
  { char: '磬', meaning: '磬石，礼乐', source: '《诗经·小雅》', sourceDetail: '笙磬同音。', gender: 'n', tags: ['classic', 'elegant'] },
  { char: '箫', meaning: '洞箫，清雅', source: '苏轼《赤壁赋》', sourceDetail: '客有吹洞箫者。', gender: 'n', tags: ['poetic', 'elegant'] },
  { char: '舸', meaning: '大船，壮阔', source: '王勃《滕王阁序》', sourceDetail: '舸舰弥津。', gender: 'm', tags: ['grand', 'poetic'] },
  { char: '舫', meaning: '小船，雅致', source: '《说文》', sourceDetail: '舫，舟也。', gender: 'n', tags: ['elegant', 'poetic'] },
  { char: '骧', meaning: '马昂首，奋发', source: '《说文》', sourceDetail: '骧，马之低昂也。', gender: 'm', tags: ['grand'] },
  { char: '骥', meaning: '千里马，才能', source: '曹操《龟虽寿》', sourceDetail: '老骥伏枥，志在千里。', gender: 'm', tags: ['grand', 'poetic'] },
  { char: '骐', meaning: '骏马，出众', source: '《诗经·小雅》', sourceDetail: '骐骥。', gender: 'm', tags: ['grand', 'poetic'] },
  { char: '骥', meaning: '良马，贤才', source: '《楚辞》', sourceDetail: '乘骐骥以驰骋兮。', gender: 'm', tags: ['grand', 'poetic'] },
  { char: '骐', meaning: '骏马', source: '《说文》', sourceDetail: '骐，马青骊文如博棋也。', gender: 'm', tags: ['grand'] },
  { char: '骞', meaning: '高举，飞腾', source: '《说文》', sourceDetail: '骞，马腹病也。', gender: 'm', tags: ['grand', 'poetic'] },
  { char: '彪', meaning: '虎纹，威武', source: '《说文》', sourceDetail: '彪，虎文也。', gender: 'm', tags: ['grand'] },
  { char: '蔚', meaning: '文采茂盛', source: '《文心雕龙》', sourceDetail: '蔚彼风力。', gender: 'n', tags: ['elegant', 'poetic'] },
  { char: '蕤', meaning: '草木下垂，繁盛', source: '《说文》', sourceDetail: '蕤，草木华垂貌。', gender: 'f', tags: ['elegant', 'poetic'] },
  { char: '葳', meaning: '草木茂盛', source: '《说文》', sourceDetail: '葳蕤。', gender: 'f', tags: ['poetic', 'elegant'] },
  { char: '荃', meaning: '香草，美好', source: '《楚辞》', sourceDetail: '荃不察余之中情兮。', gender: 'n', tags: ['poetic', 'elegant'] },
  { char: '蕙', meaning: '蕙兰，贤淑', source: '《楚辞》', sourceDetail: '既替余以蕙纕兮。', gender: 'f', tags: ['elegant', 'poetic'] },
  { char: '芷', meaning: '白芷，香草', source: '《楚辞》', sourceDetail: '扈江离与辟芷兮。', gender: 'f', tags: ['poetic', 'elegant'] },
  { char: '蘅', meaning: '杜蘅，香草', source: '《楚辞》', sourceDetail: '蘅芷。', gender: 'f', tags: ['poetic', 'elegant'] },
  { char: '芜', meaning: '芳草，清新', source: '《楚辞》', sourceDetail: '芳芜。', gender: 'n', tags: ['poetic'] },
  { char: '藻', meaning: '水藻，文采', source: '《诗经》', sourceDetail: '于以采藻。', gender: 'n', tags: ['elegant', 'poetic'] },
  { char: '漪', meaning: '涟漪，水波', source: '《诗经·魏风》', sourceDetail: '河水清且涟猗。', gender: 'f', tags: ['poetic', 'elegant'] },
  { char: '湄', meaning: '水边，河岸', source: '《诗经·秦风》', sourceDetail: '所谓伊人，在水之湄。', gender: 'f', tags: ['poetic', 'elegant'] },
  { char: '汀', meaning: '水边平地', source: '柳永《雨霖铃》', sourceDetail: '杨柳岸，晓风残月。', gender: 'n', tags: ['poetic', 'elegant'] },
  { char: '渚', meaning: '水中小洲', source: '王勃《滕王阁序》', sourceDetail: '鹤汀凫渚。', gender: 'n', tags: ['poetic', 'elegant'] },
  { char: '澈', meaning: '水清', source: '《说文》', sourceDetail: '澈，水清也。', gender: 'n', tags: ['elegant', 'poetic'] },
  { char: '潋', meaning: '水波荡漾', source: '苏轼《饮湖上初晴后雨》', sourceDetail: '水光潋滟晴方好。', gender: 'f', tags: ['poetic', 'elegant'] },
  { char: '滟', meaning: '水光闪烁', source: '苏轼《饮湖上初晴后雨》', sourceDetail: '水光潋滟晴方好。', gender: 'f', tags: ['poetic', 'elegant'] },
];

// ── Pre-made Two-Character Name Words ──

interface NameWord {
  word: string;
  meaning: string;
  source: string;
  gender: Gender;
  tags: Style[];
}

const WORDS: NameWord[] = [
  // ── 出自《论语》 ──
  { word: '知远', meaning: '知行合一，志存高远', source: '《论语·里仁》：士志于道。', gender: 'm', tags: ['grand', 'classic'] },
  { word: '弘毅', meaning: '志向远大，意志坚强', source: '《论语·泰伯》：士不可以不弘毅，任重而道远。', gender: 'm', tags: ['grand', 'classic'] },
  { word: '敏行', meaning: '行动敏捷，躬身力行', source: '《论语·里仁》：君子欲讷于言而敏于行。', gender: 'm', tags: ['classic', 'elegant'] },
  { word: '思齐', meaning: '见贤思齐，不断进取', source: '《论语·里仁》：见贤思齐焉。', gender: 'n', tags: ['classic', 'elegant'] },
  { word: '学思', meaning: '学思并重，知行合一', source: '《论语·为政》：学而不思则罔，思而不学则殆。', gender: 'm', tags: ['classic', 'elegant'] },
  { word: '敬之', meaning: '心存敬畏，谦恭自持', source: '《论语·季氏》：君子有九思，事思敬。', gender: 'm', tags: ['classic', 'elegant'] },
  { word: '乐山', meaning: '仁者乐山，稳重如山', source: '《论语·雍也》：知者乐水，仁者乐山。', gender: 'm', tags: ['classic', 'grand'] },
  { word: '于成', meaning: '功成于行，行成于思', source: '《论语·里仁》：德不孤，必有邻。', gender: 'm', tags: ['classic'] },
  { word: '德邻', meaning: '以德为邻，德行天下', source: '《论语·里仁》：德不孤，必有邻。', gender: 'n', tags: ['classic', 'elegant'] },
  { word: '文彬', meaning: '文质彬彬，温文尔雅', source: '《论语·雍也》：文质彬彬，然后君子。', gender: 'm', tags: ['elegant', 'classic'] },
  { word: '如玉', meaning: '温润如玉，品德高洁', source: '《论语·学而》：切切偲偲，怡怡如也。', gender: 'f', tags: ['elegant', 'poetic'] },
  { word: '以宁', meaning: '以静修身，宁静致远', source: '诸葛亮《诫子书》：非宁静无以致远。', gender: 'f', tags: ['elegant', 'poetic'] },

  // ── 出自《诗经》 ──
  { word: '静姝', meaning: '娴静美好', source: '《诗经·邶风》：静女其姝，俟我于城隅。', gender: 'f', tags: ['elegant', 'poetic', 'classic'] },
  { word: '琇莹', meaning: '美玉晶莹', source: '《诗经·卫风》：充耳琇莹。', gender: 'f', tags: ['elegant', 'poetic'] },
  { word: '如云', meaning: '美如云霞', source: '《诗经·鄘风》：鬒发如云，不屑髢也。', gender: 'f', tags: ['poetic', 'elegant'] },
  { word: '邦媛', meaning: '国之美女', source: '《诗经·鄘风》：展如之人兮，邦之媛也。', gender: 'f', tags: ['elegant', 'classic'] },
  { word: '清扬', meaning: '眉目清秀', source: '《诗经·郑风》：有美一人，清扬婉兮。', gender: 'f', tags: ['elegant', 'poetic'] },
  { word: '婉兮', meaning: '温婉动人', source: '《诗经·郑风》：有美一人，清扬婉兮。', gender: 'f', tags: ['poetic', 'elegant'] },
  { word: '柔嘉', meaning: '温柔美善', source: '《诗经·大雅》：敬尔威仪，无不柔嘉。', gender: 'f', tags: ['elegant', 'classic'] },
  { word: '徽音', meaning: '美好的声誉', source: '《诗经·大雅》：大姒嗣徽音，则百斯男。', gender: 'f', tags: ['elegant', 'classic', 'poetic'] },
  { word: '思远', meaning: '思虑深远', source: '《诗经·国风》：视尔不臧，我思不远。', gender: 'm', tags: ['grand', 'poetic', 'elegant'] },
  { word: '维翰', meaning: '栋梁之才', source: '《诗经·大雅》：价人维藩，大师维垣，大邦维屏，大宗维翰。', gender: 'm', tags: ['grand', 'classic'] },
  { word: '哲成', meaning: '智慧通达，成就大业', source: '《诗经·大雅》：既明且哲，以保其身。', gender: 'm', tags: ['grand', 'classic'] },
  { word: '骏德', meaning: '品德出众', source: '《诗经·大雅》：骏德。', gender: 'm', tags: ['grand', 'classic'] },
  { word: '其琛', meaning: '珍宝之意', source: '《诗经·鲁颂》：憬彼淮夷，来献其琛。', gender: 'm', tags: ['elegant', 'grand'] },
  { word: '柏舟', meaning: '坚贞不屈', source: '《诗经·鄘风》：泛彼柏舟，在彼中河。', gender: 'm', tags: ['classic', 'poetic'] },
  { word: '乔木', meaning: '高大挺拔', source: '《诗经·汉广》：南有乔木，不可休思。', gender: 'm', tags: ['poetic', 'grand'] },
  { word: '鸣皋', meaning: '鹤鸣九皋', source: '《诗经·小雅》：鹤鸣于九皋，声闻于天。', gender: 'm', tags: ['grand', 'poetic'] },

  // ── 出自《楚辞》 ──
  { word: '修远', meaning: '路漫漫其修远兮', source: '《楚辞·离骚》：路漫漫其修远兮，吾将上下而求索。', gender: 'm', tags: ['grand', 'poetic'] },
  { word: '灵均', meaning: '灵秀均衡', source: '《楚辞·离骚》：名余曰正则兮，字余曰灵均。', gender: 'm', tags: ['poetic', 'elegant'] },
  { word: '怀瑾', meaning: '怀抱美玉，品德高洁', source: '《楚辞·九章》：怀瑾握瑜兮。', gender: 'n', tags: ['elegant', 'poetic', 'classic'] },
  { word: '若华', meaning: '如花般美好', source: '《楚辞·天问》：羲和之未扬，若华何光？', gender: 'f', tags: ['elegant', 'poetic'] },
  { word: '望舒', meaning: '月神御者，光明', source: '《楚辞·离骚》：前望舒使先驱兮。', gender: 'n', tags: ['poetic', 'elegant'] },
  { word: '嘉树', meaning: '美好的树木', source: '《楚辞·九章》：后皇嘉树，橘徕服兮。', gender: 'm', tags: ['poetic', 'elegant'] },
  { word: '承宇', meaning: '气度恢宏', source: '《楚辞·九章》：云霏霏而承宇。', gender: 'm', tags: ['grand', 'poetic'] },
  { word: '景云', meaning: '祥瑞之云', source: '《楚辞·七谏》：龙举而景云往。', gender: 'm', tags: ['grand', 'poetic'] },
  { word: '安歌', meaning: '安然歌唱', source: '《楚辞·九歌》：疏缓节兮安歌。', gender: 'f', tags: ['poetic', 'elegant'] },
  { word: '思博', meaning: '思虑广博', source: '《楚辞·离骚》：思九州之博大。', gender: 'm', tags: ['grand', 'elegant'] },

  // ── 出自唐诗宋词 ──
  { word: '明远', meaning: '光明远大', source: '诸葛亮《诫子书》：非淡泊无以明志，非宁静无以致远。', gender: 'm', tags: ['grand', 'elegant', 'classic'] },
  { word: '清如', meaning: '清澈如许', source: '朱熹《观书有感》：问渠那得清如许？为有源头活水来。', gender: 'f', tags: ['poetic', 'elegant'] },
  { word: '暮云', meaning: '暮色云霞', source: '杜甫《春日忆李白》：渭北春天树，江东日暮云。', gender: 'n', tags: ['poetic', 'elegant'] },
  { word: '锦书', meaning: '华美的书信', source: '李清照《一剪梅》：云中谁寄锦书来？', gender: 'f', tags: ['poetic', 'elegant'] },
  { word: '疏桐', meaning: '疏朗的梧桐', source: '苏轼《卜算子》：缺月挂疏桐，漏断人初静。', gender: 'n', tags: ['poetic', 'elegant'] },
  { word: '星河', meaning: '灿烂银河', source: '杜牧《秋夕》：天阶夜色凉如水，卧看牵牛织女星。', gender: 'm', tags: ['poetic', 'grand'] },
  { word: '云帆', meaning: '高挂云帆，志在远方', source: '李白《行路难》：长风破浪会有时，直挂云帆济沧海。', gender: 'm', tags: ['grand', 'poetic'] },
  { word: '沧海', meaning: '胸怀广阔', source: '曹操《观沧海》：东临碣石，以观沧海。', gender: 'm', tags: ['grand', 'poetic'] },
  { word: '澄江', meaning: '清澈的江水', source: '谢朓《晚登三山还望京邑》：余霞散成绮，澄江静如练。', gender: 'n', tags: ['poetic', 'elegant'] },
  { word: '霁月', meaning: '雨后明月', source: '黄庭坚《濂溪诗序》：胸怀洒落，如光风霁月。', gender: 'f', tags: ['poetic', 'elegant'] },
  { word: '兰舟', meaning: '兰木小舟', source: '李清照《一剪梅》：红藕香残玉簟秋，轻解罗裳，独上兰舟。', gender: 'f', tags: ['poetic', 'elegant'] },
  { word: '知许', meaning: '知我心意', source: '李清照《永遇乐》：如今憔悴，风鬟霜鬓，怕见夜间出去。', gender: 'n', tags: ['poetic', 'elegant'] },
  { word: '予安', meaning: '赐我安宁', source: '《诗经·小雅》：将母来谂，以慰予心。', gender: 'f', tags: ['elegant', 'poetic'] },
  { word: '鹤鸣', meaning: '鹤鸣九皋，声闻于天', source: '《诗经·小雅》：鹤鸣于九皋，声闻于天。', gender: 'm', tags: ['grand', 'poetic', 'classic'] },
  { word: '子衿', meaning: '青青子衿，悠悠我心', source: '《诗经·郑风》：青青子衿，悠悠我心。', gender: 'f', tags: ['poetic', 'elegant', 'classic'] },

  // ── 出自《周易》《大学》《中庸》 ──
  { word: '自强', meaning: '自强不息', source: '《周易·乾卦》：天行健，君子以自强不息。', gender: 'm', tags: ['grand', 'classic'] },
  { word: '厚德', meaning: '厚德载物', source: '《周易·坤卦》：地势坤，君子以厚德载物。', gender: 'm', tags: ['grand', 'classic'] },
  { word: '至善', meaning: '止于至善', source: '《大学》：大学之道，在明明德，在亲民，在止于至善。', gender: 'n', tags: ['classic', 'elegant'] },
  { word: '明德', meaning: '彰显美德', source: '《大学》：大学之道，在明明德。', gender: 'm', tags: ['classic', 'grand'] },
  { word: '致远', meaning: '宁静致远', source: '诸葛亮《诫子书》：非淡泊无以明志，非宁静无以致远。', gender: 'm', tags: ['grand', 'classic', 'elegant'] },
  { word: '中和', meaning: '致中和，天地位焉', source: '《中庸》：致中和，天地位焉，万物育焉。', gender: 'n', tags: ['classic', 'elegant'] },
  { word: '慎思', meaning: '审慎思考', source: '《中庸》：博学之，审问之，慎思之，明辨之，笃行之。', gender: 'm', tags: ['classic', 'elegant'] },
  { word: '笃行', meaning: '坚定践行', source: '《中庸》：博学之，审问之，慎思之，明辨之，笃行之。', gender: 'm', tags: ['classic', 'grand'] },
  { word: '谦益', meaning: '谦虚使人进步', source: '《尚书·大禹谟》：满招损，谦受益。', gender: 'm', tags: ['classic', 'elegant'] },

  // ── 出自经典名句 ──
  { word: '若水', meaning: '上善若水', source: '《道德经》：上善若水，水善利万物而不争。', gender: 'n', tags: ['elegant', 'poetic', 'classic'] },
  { word: '守拙', meaning: '抱朴守拙', source: '陶渊明《归园田居》：开荒南野际，守拙归园田。', gender: 'm', tags: ['classic', 'poetic'] },
  { word: '悠然', meaning: '悠然自得', source: '陶渊明《饮酒》：采菊东篱下，悠然见南山。', gender: 'f', tags: ['poetic', 'elegant'] },
  { word: '南山', meaning: '寿比南山', source: '陶渊明《饮酒》：采菊东篱下，悠然见南山。', gender: 'm', tags: ['poetic', 'grand'] },
  { word: '清川', meaning: '清清的河流', source: '王维《归嵩山作》：清川带长薄，车马去闲闲。', gender: 'n', tags: ['poetic', 'elegant'] },
  { word: '松风', meaning: '松间清风', source: '王维《山居秋暝》：明月松间照，清泉石上流。', gender: 'm', tags: ['poetic', 'elegant'] },
  { word: '知秋', meaning: '一叶知秋', source: '《淮南子》：见一叶落而知岁之将暮。', gender: 'n', tags: ['elegant', 'poetic'] },
  { word: '拾遗', meaning: '补录阙漏', source: '杜甫曾任左拾遗。', gender: 'm', tags: ['classic', 'elegant'] },
  { word: '归鸿', meaning: '归来的鸿雁', source: '苏轼《和子由渑池怀旧》：人生到处知何似，应似飞鸿踏雪泥。', gender: 'm', tags: ['poetic', 'grand'] },
  { word: '映雪', meaning: '映雪读书，勤学苦读', source: '《孙氏世录》：孙康家贫，常映雪读书。', gender: 'f', tags: ['elegant', 'poetic'] },
  { word: '含章', meaning: '内含文采', source: '《周易·坤卦》：含章可贞。', gender: 'f', tags: ['elegant', 'classic', 'poetic'] },
  { word: '可贞', meaning: '可以坚守正道', source: '《周易·坤卦》：含章可贞。', gender: 'f', tags: ['classic', 'elegant'] },
  { word: '之恒', meaning: '持之以恒', source: '《周易·恒卦》：天地之道，恒久而不已也。', gender: 'm', tags: ['classic', 'grand'] },
  { word: '怀信', meaning: '心怀诚信', source: '《楚辞·九章》：怀信侘傺，忽乎吾将行兮。', gender: 'm', tags: ['classic', 'elegant'] },
  { word: '秉文', meaning: '秉持文德', source: '《诗经·周颂》：秉文之德。', gender: 'm', tags: ['classic', 'elegant', 'grand'] },
  { word: '思诚', meaning: '真诚思考', source: '《孟子·离娄上》：思诚者，人之道也。', gender: 'm', tags: ['classic', 'elegant'] },
  { word: '浩然', meaning: '浩然正气', source: '《孟子·公孙丑上》：我善养吾浩然之气。', gender: 'm', tags: ['grand', 'classic', 'poetic'] },
  { word: '立雪', meaning: '程门立雪，尊师重道', source: '《宋史·杨时传》：程门立雪。', gender: 'n', tags: ['classic', 'elegant'] },
  { word: '知非', meaning: '知错能改', source: '《左传》：知错能改，善莫大焉。', gender: 'm', tags: ['classic', 'elegant'] },
  { word: '成蹊', meaning: '桃李不言，下自成蹊', source: '《史记·李将军列传》：桃李不言，下自成蹊。', gender: 'm', tags: ['classic', 'elegant', 'poetic'] },

  // ── 出自《尚书》 ──
  { word: '允文', meaning: '允恭克让，文治武功', source: '《尚书·尧典》：允恭克让，光被四表。', gender: 'm', tags: ['classic', 'grand'] },
  { word: '克明', meaning: '能够明察', source: '《尚书·尧典》：克明俊德，以亲九族。', gender: 'm', tags: ['classic', 'grand'] },
  { word: '浚哲', meaning: '深邃的智慧', source: '《尚书·太甲》：浚哲文明。', gender: 'm', tags: ['classic', 'grand'] },
  { word: '有恒', meaning: '持之以恒', source: '《尚书·咸有一德》：终始惟一，时乃日新。', gender: 'm', tags: ['classic', 'grand'] },
  { word: '日新', meaning: '日日更新', source: '《大学》：苟日新，日日新，又日新。', gender: 'n', tags: ['classic', 'grand', 'elegant'] },
  { word: '惟精', meaning: '精益求精', source: '《尚书·大禹谟》：惟精惟一，允执厥中。', gender: 'm', tags: ['classic', 'grand'] },
  { word: '执中', meaning: '秉持中道', source: '《尚书·大禹谟》：惟精惟一，允执厥中。', gender: 'm', tags: ['classic', 'elegant'] },

  // ── 出自《礼记》 ──
  { word: '博闻', meaning: '见多识广', source: '《礼记·曲礼》：博闻强识而让。', gender: 'm', tags: ['classic', 'grand'] },
  { word: '强识', meaning: '记忆力强，见识广博', source: '《礼记·曲礼》：博闻强识而让。', gender: 'm', tags: ['classic', 'grand'] },
  { word: '敦敏', meaning: '敦厚聪敏', source: '《礼记·中庸》：敦敏。', gender: 'm', tags: ['classic', 'elegant'] },
  { word: '乐成', meaning: '乐于成就', source: '《礼记·乐记》：大乐与天地同和。', gender: 'm', tags: ['classic', 'grand'] },
  { word: '知本', meaning: '知晓根本', source: '《大学》：物有本末，事有终始，知所先后，则近道矣。', gender: 'm', tags: ['classic', 'elegant'] },
  { word: '致知', meaning: '获得知识', source: '《大学》：致知在格物。', gender: 'm', tags: ['classic', 'elegant'] },

  // ── 出自《左传》 ──
  { word: '立德', meaning: '树立德行', source: '《左传·襄公二十四年》：太上有立德，其次有立功，其次有立言。', gender: 'm', tags: ['classic', 'grand'] },
  { word: '立功', meaning: '建功立业', source: '《左传·襄公二十四年》：太上有立德，其次有立功。', gender: 'm', tags: ['classic', 'grand'] },
  { word: '立言', meaning: '著书立说', source: '《左传·襄公二十四年》：其次有立言，虽久不废。', gender: 'm', tags: ['classic', 'elegant'] },
  { word: '不朽', meaning: '永垂不朽', source: '《左传·襄公二十四年》：虽久不废，此之谓不朽。', gender: 'm', tags: ['classic', 'grand'] },
  { word: '居安', meaning: '居安思危', source: '《左传·襄公十一年》：居安思危，思则有备。', gender: 'm', tags: ['classic', 'elegant'] },
  { word: '思危', meaning: '居安思危', source: '《左传·襄公十一年》：居安思危。', gender: 'm', tags: ['classic', 'grand'] },

  // ── 出自《史记》 ──
  { word: '鸿志', meaning: '鸿鹄之志', source: '《史记·陈涉世家》：燕雀安知鸿鹄之志哉！', gender: 'm', tags: ['grand', 'poetic'] },
  { word: '相如', meaning: '才如相如', source: '《史记·司马相如列传》：相如。', gender: 'm', tags: ['classic', 'elegant'] },
  { word: '长卿', meaning: '才华出众', source: '《史记·司马相如列传》：司马相如字长卿。', gender: 'm', tags: ['elegant', 'classic'] },
  { word: '子长', meaning: '长久之意', source: '《史记》：司马迁字子长。', gender: 'm', tags: ['classic', 'elegant'] },
  { word: '子云', meaning: '高远如云', source: '《汉书》：扬雄字子云。', gender: 'm', tags: ['classic', 'poetic'] },
  { word: '牧之', meaning: '治理之意', source: '《史记》：杜牧字牧之。', gender: 'm', tags: ['classic', 'elegant'] },
  { word: '无忌', meaning: '无所忌惮，坦荡', source: '《史记·魏公子列传》：魏公子无忌。', gender: 'm', tags: ['classic', 'grand'] },

  // ── 出自《庄子》 ──
  { word: '逍遥', meaning: '自由自在', source: '《庄子·逍遥游》：逍遥游。', gender: 'm', tags: ['poetic', 'grand'] },
  { word: '扶摇', meaning: '旋风，腾飞', source: '《庄子·逍遥游》：抟扶摇而上者九万里。', gender: 'm', tags: ['grand', 'poetic'] },
  { word: '天籁', meaning: '自然之音', source: '《庄子·齐物论》：女闻人籁而未闻地籁，女闻地籁而未闻天籁夫！', gender: 'n', tags: ['poetic', 'elegant'] },
  { word: '秋水', meaning: '清澈明净', source: '《庄子·秋水》：秋水时至，百川灌河。', gender: 'f', tags: ['poetic', 'elegant'] },
  { word: '濠梁', meaning: '鱼之乐', source: '《庄子·秋水》：子非鱼，安知鱼之乐？', gender: 'm', tags: ['poetic', 'classic'] },
  { word: '无为', meaning: '顺应自然', source: '《道德经》：道常无为而无不为。', gender: 'm', tags: ['classic', 'elegant'] },
  { word: '若虚', meaning: '大智若愚，虚怀若谷', source: '《道德经》：大盈若冲，其用不穷。', gender: 'm', tags: ['classic', 'elegant'] },

  // ── 出自《世说新语》 ──
  { word: '琳琅', meaning: '美玉，出众', source: '《世说新语》：琅琊王伯舆，终当为情死。', gender: 'n', tags: ['elegant', 'poetic'] },
  { word: '风骨', meaning: '风度骨气', source: '《世说新语》：韩康伯标置。', gender: 'm', tags: ['grand', 'classic'] },
  { word: '朗月', meaning: '明亮的月亮', source: '《世说新语》：朗朗如日月之入怀。', gender: 'n', tags: ['poetic', 'elegant'] },
  { word: '玉山', meaning: '风姿如玉山', source: '《世说新语》：嵇叔夜之为人也，岩岩若孤松之独立；其醉也，傀俄若玉山之将崩。', gender: 'm', tags: ['elegant', 'poetic'] },
  { word: '咏絮', meaning: '才女之意', source: '《世说新语》：谢道韫曰：未若柳絮因风起。', gender: 'f', tags: ['elegant', 'poetic', 'classic'] },
  { word: '兰芝', meaning: '芝兰玉树', source: '《世说新语》：譬如芝兰玉树，欲使其生于庭阶耳。', gender: 'f', tags: ['elegant', 'poetic'] },
  { word: '玉树', meaning: '芝兰玉树，才华出众', source: '《世说新语》：芝兰玉树。', gender: 'm', tags: ['elegant', 'poetic'] },

  // ── 出自《滕王阁序》《岳阳楼记》《赤壁赋》 ──
  { word: '长天', meaning: '秋水共长天一色', source: '王勃《滕王阁序》：落霞与孤鹜齐飞，秋水共长天一色。', gender: 'm', tags: ['grand', 'poetic'] },
  { word: '逸兴', meaning: '超逸的兴致', source: '王勃《滕王阁序》：遥襟甫畅，逸兴遄飞。', gender: 'm', tags: ['poetic', 'elegant'] },
  { word: '遄飞', meaning: '迅速飞扬', source: '王勃《滕王阁序》：逸兴遄飞。', gender: 'm', tags: ['grand', 'poetic'] },
  { word: '临风', meaning: '迎风而立', source: '范仲淹《岳阳楼记》：把酒临风，其喜洋洋者矣。', gender: 'm', tags: ['poetic', 'elegant'] },
  { word: '先忧', meaning: '先天下之忧而忧', source: '范仲淹《岳阳楼记》：先天下之忧而忧。', gender: 'm', tags: ['grand', 'classic'] },
  { word: '后乐', meaning: '后天下之乐而乐', source: '范仲淹《岳阳楼记》：后天下之乐而乐。', gender: 'm', tags: ['grand', 'classic'] },
  { word: '旷远', meaning: '心胸旷达', source: '范仲淹《岳阳楼记》：心旷神怡，宠辱偕忘。', gender: 'm', tags: ['grand', 'poetic'] },
  { word: '清风', meaning: '清风明月', source: '苏轼《赤壁赋》：清风徐来，水波不兴。', gender: 'n', tags: ['poetic', 'elegant'] },
  { word: '水光', meaning: '水光潋滟', source: '苏轼《饮湖上初晴后雨》：水光潋滟晴方好。', gender: 'n', tags: ['poetic', 'elegant'] },
  { word: '潋滟', meaning: '水波荡漾', source: '苏轼《饮湖上初晴后雨》：水光潋滟晴方好。', gender: 'f', tags: ['poetic', 'elegant'] },
  { word: '空明', meaning: '澄澈空灵', source: '苏轼《记承天寺夜游》：庭下如积水空明。', gender: 'n', tags: ['poetic', 'elegant'] },
  { word: '旷达', meaning: '豁达开朗', source: '苏轼《定风波》：一蓑烟雨任平生。', gender: 'm', tags: ['grand', 'poetic'] },

  // ── 出自《道德经》 ──
  { word: '知足', meaning: '知足常乐', source: '《道德经》：知足者富。', gender: 'n', tags: ['classic', 'elegant'] },
  { word: '若谷', meaning: '虚怀若谷', source: '《道德经》：旷兮其若谷。', gender: 'm', tags: ['classic', 'elegant'] },
  { word: '抱朴', meaning: '保持本真', source: '《道德经》：见素抱朴。', gender: 'm', tags: ['classic', 'elegant'] },
  { word: '含德', meaning: '内含德行', source: '《道德经》：含德之厚，比于赤子。', gender: 'n', tags: ['classic', 'elegant'] },
  { word: '守静', meaning: '守持宁静', source: '《道德经》：致虚极，守静笃。', gender: 'n', tags: ['classic', 'elegant'] },
  { word: '致虚', meaning: '达到虚空', source: '《道德经》：致虚极，守静笃。', gender: 'm', tags: ['classic', 'elegant'] },

  // ── 出自经典诗词 ──
  { word: '可期', meaning: '未来可期', source: '《古诗十九首》：弃捐勿复道，努力加餐饭。', gender: 'n', tags: ['elegant', 'poetic'] },
  { word: '未央', meaning: '未尽，无尽', source: '《诗经·小雅》：夜如何其？夜未央。', gender: 'n', tags: ['poetic', 'elegant', 'classic'] },
  { word: '如故', meaning: '一如既往', source: '《古诗十九首》：相去日已远，衣带日已缓。', gender: 'n', tags: ['classic', 'poetic'] },
  { word: '相宜', meaning: '恰到好处', source: '苏轼《饮湖上初晴后雨》：欲把西湖比西子，淡妆浓抹总相宜。', gender: 'f', tags: ['poetic', 'elegant'] },
  { word: '初晴', meaning: '雨后初晴', source: '苏轼《饮湖上初晴后雨》：水光潋滟晴方好。', gender: 'f', tags: ['poetic', 'elegant'] },
  { word: '如是', meaning: '如是而已', source: '《金刚经》：如是我闻。', gender: 'n', tags: ['classic', 'elegant'] },
  { word: '观澜', meaning: '观水有术，必观其澜', source: '《孟子·尽心上》：观水有术，必观其澜。', gender: 'm', tags: ['grand', 'classic'] },
  { word: '养浩', meaning: '善养浩然之气', source: '《孟子·公孙丑上》：我善养吾浩然之气。', gender: 'm', tags: ['grand', 'classic'] },
  { word: '知言', meaning: '善于分析言论', source: '《孟子·公孙丑上》：我知言，我善养吾浩然之气。', gender: 'm', tags: ['classic', 'elegant'] },
  { word: '正则', meaning: '正直有原则', source: '《楚辞·离骚》：名余曰正则兮。', gender: 'm', tags: ['classic', 'grand'] },
  { word: '灵均', meaning: '灵秀均衡', source: '《楚辞·离骚》：字余曰灵均。', gender: 'm', tags: ['poetic', 'elegant'] },
  { word: '济世', meaning: '济世安民', source: '《孟子》：穷则独善其身，达则兼善天下。', gender: 'm', tags: ['grand', 'classic'] },
  { word: '善群', meaning: '善于合群', source: '《荀子·王制》：人能群。', gender: 'm', tags: ['classic'] },
  { word: '弘道', meaning: '弘扬大道', source: '《论语·卫灵公》：人能弘道，非道弘人。', gender: 'm', tags: ['classic', 'grand'] },
  { word: '知新', meaning: '温故知新', source: '《论语·为政》：温故而知新，可以为师矣。', gender: 'n', tags: ['classic', 'elegant'] },
  { word: '乐天', meaning: '乐天知命', source: '《周易·系辞》：乐天知命，故不忧。', gender: 'm', tags: ['classic', 'elegant', 'poetic'] },
  { word: '安仁', meaning: '安于仁德', source: '《论语·里仁》：仁者安仁。', gender: 'n', tags: ['classic', 'elegant'] },
  { word: '利仁', meaning: '利于行仁', source: '《论语·里仁》：知者利仁。', gender: 'm', tags: ['classic', 'elegant'] },
  { word: '怀德', meaning: '心怀德行', source: '《论语·里仁》：君子怀德。', gender: 'n', tags: ['classic', 'elegant'] },
  { word: '志学', meaning: '立志于学', source: '《论语·为政》：吾十有五而志于学。', gender: 'm', tags: ['classic', 'elegant'] },
  { word: '从心', meaning: '从心所欲不逾矩', source: '《论语·为政》：七十而从心所欲，不逾矩。', gender: 'n', tags: ['classic', 'elegant'] },

  // ── 更多词语补遗 ──
  { word: '怀瑾', meaning: '怀抱美玉', source: '《楚辞·九章》：怀瑾握瑜兮。', gender: 'n', tags: ['elegant', 'poetic', 'classic'] },
  { word: '握瑜', meaning: '手握美玉', source: '《楚辞·九章》：怀瑾握瑜兮。', gender: 'n', tags: ['elegant', 'poetic'] },
  { word: '朝晖', meaning: '早晨的阳光', source: '范仲淹《岳阳楼记》：朝晖夕阴，气象万千。', gender: 'n', tags: ['poetic', 'grand'] },
  { word: '夕阴', meaning: '傍晚的阴霾', source: '范仲淹《岳阳楼记》：朝晖夕阴。', gender: 'n', tags: ['poetic'] },
  { word: '气象', meaning: '气象万千', source: '范仲淹《岳阳楼记》：气象万千。', gender: 'm', tags: ['grand', 'poetic'] },
  { word: '万顷', meaning: '广阔无边', source: '范仲淹《岳阳楼记》：一碧万顷。', gender: 'm', tags: ['grand', 'poetic'] },
  { word: '皓月', meaning: '明亮的月亮', source: '范仲淹《岳阳楼记》：皓月千里。', gender: 'f', tags: ['poetic', 'elegant'] },
  { word: '浮光', meaning: '水面的光影', source: '范仲淹《岳阳楼记》：浮光跃金。', gender: 'n', tags: ['poetic', 'elegant'] },
  { word: '跃金', meaning: '金光闪烁', source: '范仲淹《岳阳楼记》：浮光跃金。', gender: 'n', tags: ['poetic', 'grand'] },
  { word: '静影', meaning: '静静的倒影', source: '范仲淹《岳阳楼记》：静影沉璧。', gender: 'f', tags: ['poetic', 'elegant'] },
  { word: '沉璧', meaning: '如沉入水中的玉璧', source: '范仲淹《岳阳楼记》：静影沉璧。', gender: 'n', tags: ['poetic', 'elegant'] },
  { word: '翔集', meaning: '飞翔栖息', source: '范仲淹《岳阳楼记》：沙鸥翔集。', gender: 'm', tags: ['poetic'] },
  { word: '锦鳞', meaning: '美丽的鱼', source: '范仲淹《岳阳楼记》：锦鳞游泳。', gender: 'n', tags: ['poetic', 'elegant'] },
  { word: '岸芷', meaning: '岸边的白芷', source: '范仲淹《岳阳楼记》：岸芷汀兰。', gender: 'f', tags: ['poetic', 'elegant'] },
  { word: '汀兰', meaning: '水边的兰花', source: '范仲淹《岳阳楼记》：岸芷汀兰。', gender: 'f', tags: ['poetic', 'elegant'] },
  { word: '青云', meaning: '高远之志', source: '王勃《滕王阁序》：穷且益坚，不坠青云之志。', gender: 'm', tags: ['grand', 'poetic'] },
  { word: '益坚', meaning: '越发坚强', source: '王勃《滕王阁序》：穷且益坚。', gender: 'm', tags: ['grand', 'classic'] },
  { word: '桑榆', meaning: '日落之处，晚年', source: '王勃《滕王阁序》：东隅已逝，桑榆非晚。', gender: 'n', tags: ['poetic', 'classic'] },
  { word: '东隅', meaning: '日出之处，青春', source: '王勃《滕王阁序》：东隅已逝，桑榆非晚。', gender: 'n', tags: ['classic', 'poetic'] },
  { word: '非晚', meaning: '为时未晚', source: '王勃《滕王阁序》：桑榆非晚。', gender: 'n', tags: ['classic', 'elegant'] },
  { word: '凌云', meaning: '直上云霄', source: '王勃《滕王阁序》：抚凌云而自惜。', gender: 'm', tags: ['grand', 'poetic'] },
  { word: '自惜', meaning: '自我珍惜', source: '王勃《滕王阁序》：抚凌云而自惜。', gender: 'n', tags: ['elegant', 'classic'] },
  { word: '知命', meaning: '乐天知命', source: '《周易·系辞》：乐天知命，故不忧。', gender: 'm', tags: ['classic', 'elegant'] },
  { word: '乐天', meaning: '乐天知命', source: '《周易·系辞》：乐天知命，故不忧。', gender: 'm', tags: ['classic', 'elegant', 'poetic'] },
  { word: '穷理', meaning: '穷究事理', source: '《周易·说卦》：穷理尽性以至于命。', gender: 'm', tags: ['classic', 'elegant'] },
  { word: '尽性', meaning: '充分发挥本性', source: '《周易·说卦》：穷理尽性以至于命。', gender: 'n', tags: ['classic', 'elegant'] },
  { word: '日进', meaning: '日日进步', source: '《礼记·大学》：苟日新，日日新。', gender: 'm', tags: ['classic', 'grand'] },
  { word: '时习', meaning: '时时温习', source: '《论语·学而》：学而时习之。', gender: 'n', tags: ['classic', 'elegant'] },
  { word: '有朋', meaning: '有友朋来', source: '《论语·学而》：有朋自远方来。', gender: 'n', tags: ['classic', 'elegant'] },
  { word: '近悦', meaning: '近者悦，远者来', source: '《论语·子路》：近者悦，远者来。', gender: 'n', tags: ['classic', 'elegant'] },
  { word: '远来', meaning: '远方来归', source: '《论语·子路》：近者悦，远者来。', gender: 'n', tags: ['classic', 'grand'] },
  { word: '不器', meaning: '君子不器', source: '《论语·为政》：君子不器。', gender: 'm', tags: ['classic', 'grand'] },
  { word: '周行', meaning: '大道，正道', source: '《诗经·小雅》：示我周行。', gender: 'm', tags: ['classic', 'grand'] },
  { word: '邦彦', meaning: '国之英才', source: '《诗经·郑风》：彼其之子，邦之彦兮。', gender: 'm', tags: ['grand', 'classic'] },
  { word: '邦媛', meaning: '国之美女', source: '《诗经·鄘风》：展如之人兮，邦之媛也。', gender: 'f', tags: ['elegant', 'classic'] },
  { word: '令仪', meaning: '美好的仪态', source: '《诗经·大雅》：岂弟君子，莫不令仪。', gender: 'f', tags: ['elegant', 'classic'] },
  { word: '攸宁', meaning: '安宁之所', source: '《诗经·大雅》：君子有酒，嘉宾式燕绥之。', gender: 'n', tags: ['elegant', 'classic'] },
  { word: '作孚', meaning: '令人信服', source: '《诗经·大雅》：仪刑文王，万邦作孚。', gender: 'm', tags: ['classic', 'grand'] },
  { word: '维新', meaning: '革新图强', source: '《诗经·大雅》：周虽旧邦，其命维新。', gender: 'm', tags: ['classic', 'grand'] },
  { word: '自牧', meaning: '自我修养', source: '《周易·谦卦》：谦谦君子，卑以自牧也。', gender: 'm', tags: ['classic', 'elegant'] },
  { word: '以谦', meaning: '以谦逊自持', source: '《周易·谦卦》：谦谦君子。', gender: 'm', tags: ['classic', 'elegant'] },
  { word: '顺德', meaning: '顺从美德', source: '《周易·升卦》：君子以顺德，积小以高大。', gender: 'n', tags: ['classic', 'elegant'] },
  { word: '积高', meaning: '积少成多', source: '《周易·升卦》：积小以高大。', gender: 'm', tags: ['classic', 'grand'] },
  { word: '鸣谦', meaning: '谦虚之名远扬', source: '《周易·谦卦》：鸣谦，贞吉。', gender: 'm', tags: ['classic', 'elegant'] },
  { word: '敦复', meaning: '敦厚复归', source: '《周易·复卦》：敦复，无悔。', gender: 'm', tags: ['classic'] },
  { word: '观颐', meaning: '观察养生之道', source: '《周易·颐卦》：观颐。', gender: 'm', tags: ['classic'] },
  { word: '临风', meaning: '迎风而立', source: '范仲淹《岳阳楼记》：把酒临风。', gender: 'm', tags: ['poetic', 'elegant'] },
  { word: '把酒', meaning: '举杯', source: '苏轼《水调歌头》：把酒问青天。', gender: 'm', tags: ['poetic', 'grand'] },
  { word: '乘风', meaning: '乘风破浪', source: '李白《行路难》：长风破浪会有时。', gender: 'm', tags: ['grand', 'poetic'] },
  { word: '破浪', meaning: '破浪前行', source: '《宋书·宗悫传》：愿乘长风破万里浪。', gender: 'm', tags: ['grand', 'poetic'] },
  { word: '挂帆', meaning: '挂帆远航', source: '李白《行路难》：直挂云帆济沧海。', gender: 'm', tags: ['grand', 'poetic'] },
  { word: '济沧', meaning: '渡过沧海', source: '李白《行路难》：直挂云帆济沧海。', gender: 'm', tags: ['grand', 'poetic'] },
  { word: '秋实', meaning: '秋天的果实', source: '《三国志》：采庶子之春华，忘家丞之秋实。', gender: 'n', tags: ['elegant', 'classic'] },
  { word: '春华', meaning: '春天的花朵', source: '《三国志》：采庶子之春华。', gender: 'n', tags: ['elegant', 'poetic'] },
  { word: '木欣', meaning: '草木欣欣', source: '陶渊明《归去来兮辞》：木欣欣以向荣。', gender: 'n', tags: ['poetic', 'elegant'] },
  { word: '向荣', meaning: '欣欣向荣', source: '陶渊明《归去来兮辞》：木欣欣以向荣。', gender: 'n', tags: ['poetic', 'grand'] },
  { word: '涓流', meaning: '涓涓细流', source: '陶渊明《归去来兮辞》：泉涓涓而始流。', gender: 'n', tags: ['poetic', 'elegant'] },
  { word: '善渊', meaning: '心善渊', source: '《道德经》：居善地，心善渊。', gender: 'm', tags: ['classic', 'elegant'] },
  { word: '正善', meaning: '正直善良', source: '《道德经》：正善治。', gender: 'n', tags: ['classic', 'elegant'] },
  { word: '事善', meaning: '善于做事', source: '《道德经》：事善能。', gender: 'm', tags: ['classic'] },
  { word: '动善', meaning: '善于行动', source: '《道德经》：动善时。', gender: 'm', tags: ['classic'] },
  { word: '夫唯', meaning: '唯有', source: '《道德经》：夫唯不争，故天下莫能与之争。', gender: 'm', tags: ['classic'] },
  { word: '不争', meaning: '不与人争', source: '《道德经》：夫唯不争，故天下莫能与之争。', gender: 'n', tags: ['classic', 'elegant'] },
  { word: '若愚', meaning: '大智若愚', source: '《道德经》：大直若屈，大巧若拙，大辩若讷。', gender: 'm', tags: ['classic', 'elegant'] },
  { word: '若拙', meaning: '大巧若拙', source: '《道德经》：大巧若拙。', gender: 'm', tags: ['classic', 'elegant'] },
];

// ── Historical Figures ──

const FIGURES = [
  { name: '诸葛亮', zi: '孔明', hao: '卧龙', era: '三国', origin: '《诗经·大雅》："既明且哲，以保其身。"', quote: '非淡泊无以明志，非宁静无以致远。' },
  { name: '苏轼', zi: '子瞻', hao: '东坡居士', era: '北宋', origin: '《左传》："瞻望弗及，伫立以泣。"', quote: '大江东去，浪淘尽，千古风流人物。' },
  { name: '李白', zi: '太白', hao: '青莲居士', era: '唐', origin: '《诗经·小雅》："东有启明，西有长庚。"太白即长庚星。', quote: '长风破浪会有时，直挂云帆济沧海。' },
  { name: '杜甫', zi: '子美', hao: '少陵野老', era: '唐', origin: '《说文》："甫，男子之美称也。"', quote: '会当凌绝顶，一览众山小。' },
  { name: '王维', zi: '摩诘', hao: '诗佛', era: '唐', origin: '《维摩诘经》：维摩诘，佛经中居士名。', quote: '行到水穷处，坐看云起时。' },
  { name: '辛弃疾', zi: '幼安', hao: '稼轩', era: '南宋', origin: '《汉书》霍去病："去病"与"弃疾"意近，寓意去除疾病。', quote: '众里寻他千百度，蓦然回首，那人却在灯火阑珊处。' },
  { name: '欧阳修', zi: '永叔', hao: '醉翁', era: '北宋', origin: '《周易》："修辞立其诚。"', quote: '醉翁之意不在酒，在乎山水之间也。' },
  { name: '韩愈', zi: '退之', hao: '昌黎先生', era: '唐', origin: '《说文》："愈，胜也。"字退之，取以退为进之意。', quote: '业精于勤荒于嬉，行成于思毁于随。' },
  { name: '柳宗元', zi: '子厚', hao: '柳河东', era: '唐', origin: '《说文》："元，始也。"子厚，厚德载物之意。', quote: '千山鸟飞绝，万径人踪灭。' },
  { name: '陶渊明', zi: '元亮', hao: '五柳先生', era: '东晋', origin: '《说文》："渊，回水也。"明，光明。', quote: '采菊东篱下，悠然见南山。' },
  { name: '谢道韫', zi: '', hao: '', era: '东晋', origin: '《说文》："韫，藏也。"道韫，蕴含道理之意。', quote: '未若柳絮因风起。' },
  { name: '李清照', zi: '', hao: '易安居士', era: '南宋', origin: '《说文》："清，朗也。照，明也。"', quote: '知否？知否？应是绿肥红瘦。' },
  { name: '王安石', zi: '介甫', hao: '临川先生', era: '北宋', origin: '《说文》："安，定也。石，坚也。"', quote: '春风又绿江南岸，明月何时照我还。' },
  { name: '范仲淹', zi: '希文', hao: '文正', era: '北宋', origin: '《说文》："仲，中也。"希文，希慕文王之意。', quote: '先天下之忧而忧，后天下之乐而乐。' },
  { name: '司马迁', zi: '子长', hao: '', era: '西汉', origin: '《说文》："迁，登也。"子长，长久之意。', quote: '人固有一死，或重于泰山，或轻于鸿毛。' },
  { name: '曹操', zi: '孟德', hao: '', era: '三国', origin: '《说文》："操，持也。"孟德，德行之首。', quote: '老骥伏枥，志在千里。烈士暮年，壮心不已。' },
  { name: '嵇康', zi: '叔夜', hao: '', era: '三国', origin: '《说文》："康，安也。"叔夜，安静之意。', quote: '广陵散于今绝矣。' },
  { name: '阮籍', zi: '嗣宗', hao: '', era: '三国', origin: '《说文》："籍，簿书也。"嗣宗，继承祖宗之意。', quote: '时无英雄，使竖子成名。' },
  { name: '白居易', zi: '乐天', hao: '香山居士', era: '唐', origin: '《中庸》："君子居易以俟命。"乐天，乐天知命。', quote: '同是天涯沦落人，相逢何必曾相识。' },
  { name: '刘禹锡', zi: '梦得', hao: '', era: '唐', origin: '《说文》："禹，夏禹也。"锡，赐也。', quote: '沉舟侧畔千帆过，病树前头万木春。' },
  { name: '陆游', zi: '务观', hao: '放翁', era: '南宋', origin: '《说文》："游，旌旗之流也。"', quote: '山重水复疑无路，柳暗花明又一村。' },
  { name: '文天祥', zi: '宋瑞', hao: '文山', era: '南宋', origin: '《说文》："祥，福也。"宋瑞，宋之祥瑞。', quote: '人生自古谁无死，留取丹心照汗青。' },
  { name: '屈原', zi: '原', hao: '灵均', era: '战国', origin: '《说文》："原，水泉本也。"屈原名平，字原。', quote: '路漫漫其修远兮，吾将上下而求索。' },
  { name: '庄周', zi: '', hao: '南华真人', era: '战国', origin: '《说文》："周，密也。"庄周，周密之意。', quote: '子非鱼，安知鱼之乐？' },
  { name: '孟浩然', zi: '', hao: '', era: '唐', origin: '《孟子》："我善养吾浩然之气。"', quote: '春眠不觉晓，处处闻啼鸟。' },
  { name: '苏洵', zi: '明允', hao: '老泉', era: '北宋', origin: '《说文》："洵，诚也。"明允，明察诚信之意。', quote: '六国破灭，非兵不利，战不善。' },
  { name: '苏辙', zi: '子由', hao: '颍滨遗老', era: '北宋', origin: '《说文》："辙，车迹也。"子由，顺由之意。', quote: '有推位让国之美。' },
  { name: '曾巩', zi: '子固', hao: '', era: '北宋', origin: '《说文》："巩，以韦束也。"子固，坚固之意。', quote: '曾巩文章，议论必本于经。' },
  { name: '黄庭坚', zi: '鲁直', hao: '山谷道人', era: '北宋', origin: '《说文》："庭，宫中也。"鲁直，鲁莽直率之意。', quote: '桃李春风一杯酒，江湖夜雨十年灯。' },
  { name: '秦观', zi: '少游', hao: '淮海居士', era: '北宋', origin: '《说文》："观，谛视也。"少游，少年游历之意。', quote: '两情若是久长时，又岂在朝朝暮暮。' },
  { name: '晏殊', zi: '同叔', hao: '', era: '北宋', origin: '《说文》："殊，异也。"同叔，协同之意。', quote: '无可奈何花落去，似曾相识燕归来。' },
  { name: '纳兰性德', zi: '容若', hao: '楞伽山人', era: '清', origin: '《说文》："性，人之阳气也。"容若，容貌温雅。', quote: '人生若只如初见，何事秋风悲画扇。' },
  { name: '郑燮', zi: '克柔', hao: '板桥', era: '清', origin: '《说文》："燮，和也。"克柔，能够柔和之意。', quote: '千磨万击还坚劲，任尔东西南北风。' },
  { name: '曹雪芹', zi: '', hao: '雪芹', era: '清', origin: '《说文》："芹，楚葵也。"雪芹，雪中之芹。', quote: '满纸荒唐言，一把辛酸泪。' },
  { name: '纪昀', zi: '晓岚', hao: '石云', era: '清', origin: '《说文》："昀，日光也。"晓岚，破晓山岚。', quote: '铁齿铜牙纪晓岚。' },
];

// ── Generation Logic ──

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function pickN<T>(arr: T[], n: number): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, n);
}

function filterChars(gender: Gender, style: Style): NameChar[] {
  return CHARS.filter((c) => {
    const genderOk = gender === 'n' || c.gender === 'n' || c.gender === gender;
    const styleOk = style === 'random' || c.tags.includes(style);
    return genderOk && styleOk;
  });
}

function filterWords(gender: Gender, style: Style): NameWord[] {
  return WORDS.filter((w) => {
    const genderOk = gender === 'n' || w.gender === 'n' || w.gender === gender;
    const styleOk = style === 'random' || w.tags.includes(style);
    return genderOk && styleOk;
  });
}

type NameLen = 1 | 2 | 0; // 0 = random

function generateOneName(surname: string, gender: Gender, style: Style, nameLen: NameLen): GeneratedName {
  const charPool = filterChars(gender, style);
  const wordPool = filterWords(gender, style);
  const fallbackChars = CHARS.filter((c) => gender === 'n' || c.gender === 'n' || c.gender === gender);
  const effectiveChars = charPool.length >= 2 ? charPool : fallbackChars;

  // Decide given name length
  const givenLen: 1 | 2 = nameLen === 0 ? (Math.random() > 0.4 ? 2 : 1) : nameLen;

  // For 2-char names, 40% chance to use a pre-made word if available
  const useWord = givenLen === 2 && wordPool.length > 0 && Math.random() < 0.4;

  if (useWord) {
    const word = pick(wordPool);
    const full = surname + word.word;
    const charEntries: NameChar[] = word.word.split('').map((ch) => {
      return CHARS.find((c) => c.char === ch) || { char: ch, meaning: '', source: '', sourceDetail: '', gender: 'n', tags: [] };
    });

    // Find matching figure
    const figureMatch = FIGURES.find((f) => {
      const nameChars = f.name.slice(1);
      return word.word.split('').some((ch) => nameChars.includes(ch)) ||
             (f.zi && word.word.split('').some((ch) => f.zi.includes(ch)));
    });

    const figureText = figureMatch
      ? `历史人物参考：${figureMatch.name}（字${figureMatch.zi}${figureMatch.hao ? '，号' + figureMatch.hao : ''}，${figureMatch.era}人）。${figureMatch.origin}代表名句："${figureMatch.quote}"`
      : '';

    const explanation = `「${word.word}」出自${word.source}\n${word.meaning}。\n\n名字寓意：「${full}」${word.meaning}${figureText ? '\n\n' + figureText : ''}`;

    return { surname, given: word.word, full, chars: charEntries, explanation, figure: figureMatch?.name };
  }

  // Combine individual characters
  const selected = pickN(effectiveChars, givenLen);
  const given = selected.map((c) => c.char).join('');
  const full = surname + given;

  const charExplanations = selected.map((c) => {
    return `「${c.char}」出自${c.source}——${c.sourceDetail.replace(/[。.]+$/, '')}。${c.meaning}。`;
  }).join('\n');

  const figureMatch = FIGURES.find((f) => {
    const nameChars = f.name.slice(1);
    return selected.some((c) => nameChars.includes(c.char)) ||
           (f.zi && selected.some((c) => f.zi.includes(c.char)));
  });

  const figureText = figureMatch
    ? `历史人物参考：${figureMatch.name}（字${figureMatch.zi}${figureMatch.hao ? '，号' + figureMatch.hao : ''}，${figureMatch.era}人）。${figureMatch.origin}代表名句："${figureMatch.quote}"`
    : '';

  const meanings = selected.map((c) => c.meaning.split('，')[0]);
  const combinedMeaning = givenLen === 2
    ? `${meanings[0]}与${meanings[1]}相合，寓意${meanings[0]}兼备${meanings[1]}之美。`
    : `寓意${meanings[0]}。`;

  const explanation = `${charExplanations}\n\n名字寓意：「${full}」${combinedMeaning}${figureText ? '\n\n' + figureText : ''}`;

  return { surname, given, full, chars: selected, explanation, figure: figureMatch?.name };
}

function generateNames(surname: string, gender: Gender, style: Style, count: number, nameLen: NameLen): GeneratedName[] {
  const results: GeneratedName[] = [];
  const seen = new Set<string>();
  let attempts = 0;
  while (results.length < count && attempts < 100) {
    const name = generateOneName(surname, gender, style, nameLen);
    if (!seen.has(name.given)) {
      seen.add(name.given);
      results.push(name);
    }
    attempts++;
  }
  return results;
}

// ── Style Labels ──

const STYLE_LABELS: Record<Style, { zh: string; en: string }> = {
  random: { zh: '不限', en: 'Any' },
  elegant: { zh: '文雅', en: 'Elegant' },
  grand: { zh: '大气', en: 'Grand' },
  poetic: { zh: '诗意', en: 'Poetic' },
  classic: { zh: '古朴', en: 'Classic' },
};

const GENDER_LABELS: Record<Gender, { zh: string; en: string }> = {
  m: { zh: '男', en: 'Male' },
  f: { zh: '女', en: 'Female' },
  n: { zh: '不限', en: 'Any' },
};

// ── Main Component ──

export default function NameGenerator() {
  const { lang, t } = useI18n();
  const { name: toolName, desc, ui, help } = useToolI18n('nameGen');
  const [surname, setSurname] = useState('张');
  const [gender, setGender] = useState<Gender>('n');
  const [style, setStyle] = useState<Style>('random');
  const [count, setCount] = useState(3);
  const [nameLen, setNameLen] = useState<NameLen>(0);
  const [results, setResults] = useState<GeneratedName[]>([]);

  const generate = useCallback(() => {
    setResults(generateNames(surname || '张', gender, style, count, nameLen));
  }, [surname, gender, style, count, nameLen]);

  return (
    <ToolShell title={toolName} description={desc}>
      <div className="ng-layout">
        {/* Left: Config */}
        <div className="ng-config">
          <div className="ng-section">
            <div className="ng-section-title">{ui.surname || 'Surname'}</div>
            <input
              className="input-field"
              value={surname}
              onChange={(e) => setSurname(e.target.value)}
              placeholder={ui.surnamePlaceholder || 'e.g. 张'}
              maxLength={4}
            />
          </div>

          <div className="ng-section">
            <div className="ng-section-title">{ui.gender || 'Gender'}</div>
            <div className="ng-btn-group">
              {(['n', 'm', 'f'] as Gender[]).map((g) => (
                <button
                  key={g}
                  className={`panel-btn panel-btn-sm${gender === g ? ' accent' : ''}`}
                  onClick={() => setGender(g)}
                >
                  {GENDER_LABELS[g][lang]}
                </button>
              ))}
            </div>
          </div>

          <div className="ng-section">
            <div className="ng-section-title">{ui.style || 'Style'}</div>
            <div className="ng-btn-group">
              {(['random', 'elegant', 'grand', 'poetic', 'classic'] as Style[]).map((s) => (
                <button
                  key={s}
                  className={`panel-btn panel-btn-sm${style === s ? ' accent' : ''}`}
                  onClick={() => setStyle(s)}
                >
                  {STYLE_LABELS[s][lang]}
                </button>
              ))}
            </div>
          </div>

          <div className="ng-section">
            <div className="ng-section-title">{ui.count || 'Count'}</div>
            <div className="ng-btn-group">
              {[1, 3, 5].map((c) => (
                <button
                  key={c}
                  className={`panel-btn panel-btn-sm${count === c ? ' accent' : ''}`}
                  onClick={() => setCount(c)}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          <div className="ng-section">
            <div className="ng-section-title">{ui.nameLen || 'Given Name Length'}</div>
            <div className="ng-btn-group">
              {([
                { val: 0 as NameLen, zh: '不限', en: 'Any' },
                { val: 1 as NameLen, zh: '单字名', en: '1 Char' },
                { val: 2 as NameLen, zh: '双字名', en: '2 Chars' },
              ]).map((opt) => (
                <button
                  key={opt.val}
                  className={`panel-btn panel-btn-sm${nameLen === opt.val ? ' accent' : ''}`}
                  onClick={() => setNameLen(opt.val)}
                >
                  {lang === 'zh' ? opt.zh : opt.en}
                </button>
              ))}
            </div>
          </div>

          <button className="panel-btn accent ng-generate-btn" onClick={generate}>
            {ui.generate || t('common.generate')}
          </button>

          {/* Source preview */}
          <div className="ng-section ng-sources">
            <div className="ng-section-title">{ui.sources || 'Sources'}</div>
            <div className="ng-source-tags">
              {['《论语》', '《孟子》', '《大学》', '《中庸》', '《诗经》', '《周易》', '《楚辞》', '《尚书》', '《礼记》', '《左传》', '《史记》', '《庄子》', '《道德经》', '《世说新语》', '《文心雕龙》', '唐诗', '宋词', '《古诗十九首》', '《滕王阁序》', '《岳阳楼记》'].map((s) => (
                <span key={s} className="ng-source-tag">{s}</span>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Results */}
        <div className="ng-results">
          {results.length === 0 ? (
            <div className="ng-empty">
              <div className="ng-empty-icon">📜</div>
              <div className="ng-empty-text">{ui.emptyHint || 'Configure options and click Generate'}</div>
            </div>
          ) : (
            results.map((name, i) => (
              <div key={i} className="ng-card">
                <div className="ng-card-name">{name.full}</div>
                <div className="ng-card-chars">
                  {name.chars.map((c, j) => (
                    <span key={j} className="ng-char-badge" title={c.meaning}>
                      {c.char}
                    </span>
                  ))}
                </div>
                <div className="ng-card-explain">
                  {name.explanation.split('\n').map((line, j) => (
                    <p key={j}>{line}</p>
                  ))}
                </div>
                {name.figure && <div className="ng-card-figure">📎 {ui.refFigure || 'Ref'}: {name.figure}</div>}
              </div>
            ))
          )}
        </div>
      </div>
      {help && <HelpSection title={help.title} features={help.features} usage={help.usage} />}
    </ToolShell>
  );
}
