import { useState, useMemo, useCallback } from 'react';
import { ToolShell } from '../../shell/ToolShell';
import { useI18n, useToolI18n } from '../../shared/context/I18nContext';
import { HelpSection } from '../../shared/components/HelpSection';

// ── Types ──

type LicenseId = 'mit' | 'apache-2.0' | 'gpl-3.0' | 'lgpl-3.0' | 'bsd-2-clause' | 'bsd-3-clause' | 'mpl-2.0' | 'agpl-3.0' | 'isc' | 'unlicense';

interface LicenseMeta {
  id: LicenseId;
  spdx: string;
  type: 'permissive' | 'copyleft' | 'weak-copyleft' | 'public-domain';
  permissions: string[];
  limitations: string[];
  conditions: string[];
  bestFor: { zh: string[]; en: string[] };
  examples: { name: string; url: string }[];
  text: string;
}

// ── License Data ──

const LICENSES: LicenseMeta[] = [
  {
    id: 'mit', spdx: 'MIT', type: 'permissive',
    permissions: ['commercial-use', 'modification', 'distribution', 'private-use'],
    limitations: ['liability', 'warranty'],
    conditions: ['include-copyright', 'include-license'],
    bestFor: {
      zh: ['小型库、工具和个人项目', '希望最大程度降低使用门槛的项目', 'npm/pip 等包管理器发布的库'],
      en: ['Small libraries, tools, and personal projects', 'Projects that want maximum adoption with minimal restrictions', 'Packages published to npm, pip, etc.'],
    },
    examples: [
      { name: 'jQuery', url: 'https://github.com/jquery/jquery' },
      { name: 'React', url: 'https://github.com/facebook/react' },
      { name: 'Vue.js', url: 'https://github.com/vuejs/vue' },
      { name: 'Babel', url: 'https://github.com/babel/babel' },
      { name: 'Express', url: 'https://github.com/expressjs/express' },
    ],
    text: `MIT License

Copyright (c) {year} {name}

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.`,
  },
  {
    id: 'apache-2.0', spdx: 'Apache-2.0', type: 'permissive',
    permissions: ['commercial-use', 'modification', 'distribution', 'patent-use', 'private-use'],
    limitations: ['liability', 'warranty'],
    conditions: ['include-copyright', 'include-license', 'state-changes'],
    bestFor: {
      zh: ['企业级项目和大型开源项目', '需要专利保护的项目', '希望明确贡献者专利授权的项目'],
      en: ['Enterprise and large-scale open source projects', 'Projects that need patent protection', 'Projects wanting explicit contributor patent grants'],
    },
    examples: [
      { name: 'Android (AOSP)', url: 'https://source.android.com/' },
      { name: 'Kubernetes', url: 'https://github.com/kubernetes/kubernetes' },
      { name: 'TensorFlow', url: 'https://github.com/tensorflow/tensorflow' },
      { name: 'Swift', url: 'https://github.com/apple/swift' },
      { name: 'Spring Framework', url: 'https://github.com/spring-projects/spring-framework' },
    ],
    text: `                                 Apache License
                           Version 2.0, January 2004
                        http://www.apache.org/licenses/

   TERMS AND CONDITIONS FOR USE, REPRODUCTION, AND DISTRIBUTION

   1. Definitions.

      "License" shall mean the terms and conditions for use, reproduction,
      and distribution as defined by Sections 1 through 9 of this document.

      "Licensor" shall mean the copyright owner or entity authorized by
      the copyright owner that is granting the License.

      "Legal Entity" shall mean the union of the acting entity and all
      other entities that control, are controlled by, or are under common
      control with that entity. For the purposes of this definition,
      "control" means (i) the power, direct or indirect, to cause the
      direction or management of such entity, whether by contract or
      otherwise, or (ii) ownership of fifty percent (50%) or more of the
      outstanding shares, or (iii) beneficial ownership of such entity.

      "You" (or "Your") shall mean an individual or Legal Entity
      exercising permissions granted by this License.

      "Source" form shall mean the preferred form for making modifications,
      including but not limited to software source code, documentation
      source, and configuration files.

      "Object" form shall mean any form resulting from mechanical
      transformation or translation of a Source form, including but
      not limited to compiled object code, generated documentation,
      and conversions to other media types.

      "Work" shall mean the work of authorship, whether in Source or
      Object form, made available under the License, as indicated by a
      copyright notice that is included in or attached to the work.

      "Derivative Works" shall mean any work, whether in Source or Object
      form, that is based on (or derived from) the Work and for which the
      editorial revisions, annotations, elaborations, or other modifications
      represent, as a whole, an original work of authorship. For the purposes
      of this License, Derivative Works shall not include works that remain
      separable from, or merely link (or bind by name) to the interfaces of,
      the Work and Derivative Works thereof.

      "Contribution" shall mean any work of authorship, including
      the original version of the Work and any modifications or additions
      to that Work or Derivative Works thereof, that is intentionally
      submitted to the Licensor for inclusion in the Work by the copyright owner
      or by an individual or Legal Entity authorized to submit on behalf of
      the copyright owner. For the purposes of this definition, "submitted"
      means any form of electronic, verbal, or written communication sent
      to the Licensor or its representatives, including but not limited to
      communication on electronic mailing lists, source code control systems,
      and issue tracking systems that are managed by, or on behalf of, the
      Licensor for the purpose of discussing and improving the Work, but
      excluding communication that is conspicuously marked or otherwise
      designated in writing by the copyright owner as "Not a Contribution."

      "Contributor" shall mean Licensor and any individual or Legal Entity
      on behalf of whom a Contribution has been received by the Licensor and
      subsequently incorporated within the Work.

   2. Grant of Copyright License. Subject to the terms and conditions of
      this License, each Contributor hereby grants to You a perpetual,
      worldwide, non-exclusive, no-charge, royalty-free, irrevocable
      copyright license to reproduce, prepare Derivative Works of,
      publicly display, publicly perform, sublicense, and distribute the
      Work and such Derivative Works in Source or Object form.

   3. Grant of Patent License. Subject to the terms and conditions of
      this License, each Contributor hereby grants to You a perpetual,
      worldwide, non-exclusive, no-charge, royalty-free, irrevocable
      (except as stated in this section) patent license to make, have made,
      use, offer to sell, sell, import, and otherwise transfer the Work,
      where such license applies only to those patent claims licensable
      by such Contributor that are necessarily infringed by their
      Contribution(s) alone or by combination of their Contribution(s)
      with the Work to which such Contribution(s) was submitted. If You
      institute patent litigation against any entity (including a
      cross-claim or counterclaim in a lawsuit) alleging that the Work
      or a Contribution incorporated within the Work constitutes direct
      or contributory patent infringement, then any patent licenses
      granted to You under this License for that Work shall terminate
      as of the date such litigation is filed.

   4. Redistribution. You may reproduce and distribute copies of the
      Work or Derivative Works thereof in any medium, with or without
      modifications, and in Source or Object form, provided that You
      meet the following conditions:

      (a) You must give any other recipients of the Work or
          Derivative Works a copy of this License; and

      (b) You must cause any modified files to carry prominent notices
          stating that You changed the files; and

      (c) You must retain, in the Source form of any Derivative Works
          that You distribute, all copyright, patent, trademark, and
          attribution notices from the Source form of the Work,
          excluding those notices that do not pertain to any part of
          the Derivative Works; and

      (d) If the Work includes a "NOTICE" text file as part of its
          distribution, then any Derivative Works that You distribute must
          include a readable copy of the attribution notices contained
          within such NOTICE file, excluding any notices that do not
          pertain to any part of the Derivative Works, in at least one
          of the following places: within a NOTICE text file distributed
          as part of the Derivative Works; within the Source form or
          documentation, if provided along with the Derivative Works; or,
          within a display generated by the Derivative Works, if and
          wherever such third-party notices normally appear. The contents
          of the NOTICE file are for informational purposes only and
          do not modify the License. You may add Your own attribution
          notices within Derivative Works that You distribute, alongside
          or as an addendum to the NOTICE text from the Work, provided
          that such additional attribution notices cannot be construed
          as modifying the License.

      You may add Your own copyright statement to Your modifications and
      may provide additional or different license terms and conditions
      for use, reproduction, or distribution of Your modifications, or
      for any such Derivative Works as a whole, provided Your use,
      reproduction, and distribution of the Work otherwise complies with
      the conditions stated in this License.

   5. Submission of Contributions. Unless You explicitly state otherwise,
      any Contribution intentionally submitted for inclusion in the Work
      by You to the Licensor shall be under the terms and conditions of
      this License, without any additional terms or conditions.
      Notwithstanding the above, nothing herein shall supersede or modify
      the terms of any separate license agreement you may have executed
      with Licensor regarding such Contributions.

   6. Trademarks. This License does not grant permission to use the trade
      names, trademarks, service marks, or product names of the Licensor,
      except as required for reasonable and customary use in describing the
      origin of the Work and reproducing the content of the NOTICE file.

   7. Disclaimer of Warranty. Unless required by applicable law or
      agreed to in writing, Licensor provides the Work (and each
      Contributor provides its Contributions) on an "AS IS" BASIS,
      WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or
      implied, including, without limitation, any warranties or conditions
      of TITLE, NON-INFRINGEMENT, MERCHANTABILITY, or FITNESS FOR A
      PARTICULAR PURPOSE. You are solely responsible for determining the
      appropriateness of using or redistributing the Work and assume any
      risks associated with Your exercise of permissions under this License.

   8. Limitation of Liability. In no event and under no legal theory,
      whether in tort (including negligence), contract, or otherwise,
      unless required by applicable law (such as deliberate and grossly
      negligent acts) or agreed to in writing, shall any Contributor be
      liable to You for damages, including any direct, indirect, special,
      incidental, or consequential damages of any character arising as a
      result of this License or out of the use or inability to use the
      Work (including but not limited to damages for loss of goodwill,
      work stoppage, computer failure or malfunction, or any and all
      other commercial damages or losses), even if such Contributor
      has been advised of the possibility of such damages.

   9. Accepting Warranty or Additional Liability. While redistributing
      the Work or Derivative Works thereof, You may choose to offer,
      and charge a fee for, acceptance of support, warranty, indemnity,
      or other liability obligations and/or rights consistent with this
      License. However, in accepting such obligations, You may act only
      on Your own behalf and on Your sole responsibility, not on behalf
      of any other Contributor, and only if You agree to indemnify,
      defend, and hold each Contributor harmless for any liability
      incurred by, or claims asserted against, such Contributor by reason
      of your accepting any such warranty or additional liability.

   END OF TERMS AND CONDITIONS

   Copyright {year} {name}

   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.`,
  },
  {
    id: 'gpl-3.0', spdx: 'GPL-3.0', type: 'copyleft',
    permissions: ['commercial-use', 'modification', 'distribution', 'patent-use', 'private-use'],
    limitations: ['liability', 'warranty'],
    conditions: ['include-copyright', 'include-license', 'state-changes', 'disclose-source', 'same-license'],
    bestFor: {
      zh: ['希望确保衍生作品也保持开源的项目', '自由软件运动支持者', '不希望代码被闭源商业化的项目'],
      en: ['Projects that want to ensure derivatives stay open source', 'Free software movement supporters', 'Projects that want to prevent closed-source commercialization'],
    },
    examples: [
      { name: 'Linux Kernel (v2)', url: 'https://github.com/torvalds/linux' },
      { name: 'WordPress', url: 'https://github.com/WordPress/WordPress' },
      { name: 'GIMP', url: 'https://www.gimp.org/' },
      { name: 'Blender', url: 'https://www.blender.org/' },
      { name: 'VLC', url: 'https://www.videolan.org/' },
    ],
    text: `                    GNU GENERAL PUBLIC LICENSE
                       Version 3, 29 June 2007

 Copyright (C) 2007 Free Software Foundation, Inc. <https://fsf.org/>
 Everyone is permitted to copy and distribute verbatim copies
 of this license document, but changing it is not allowed.

                            Preamble

  The GNU General Public License is a free, copyleft license for
software and other kinds of works.

  The licenses for most software and other practical works are designed
to take away your freedom to share and change the works.  By contrast,
the GNU General Public License is intended to guarantee your freedom to
share and change all versions of a program--to make sure it remains free
software for all its users.  We, the Free Software Foundation, use the
GNU General Public License for most of our software; it applies also to
any other work released this way by its authors.  You can apply it to
your programs, too.

  For the complete license text, please visit: https://www.gnu.org/licenses/gpl-3.0.txt

  Copyright (C) {year} {name}

  This program is free software: you can redistribute it and/or modify
  it under the terms of the GNU General Public License as published by
  the Free Software Foundation, either version 3 of the License, or
  (at your option) any later version.

  This program is distributed in the hope that it will be useful,
  but WITHOUT ANY WARRANTY; without even the implied warranty of
  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
  GNU General Public License for more details.

  You should have received a copy of the GNU General Public License
  along with this program.  If not, see <https://www.gnu.org/licenses/>.`,
  },
  {
    id: 'lgpl-3.0', spdx: 'LGPL-3.0', type: 'weak-copyleft',
    permissions: ['commercial-use', 'modification', 'distribution', 'patent-use', 'private-use'],
    limitations: ['liability', 'warranty'],
    conditions: ['include-copyright', 'include-license', 'disclose-source', 'same-license-library'],
    bestFor: {
      zh: ['开源库/框架，允许闭源项目引用', '希望代码保持开源但不强制使用者开源的库', '提供 API/SDK 的项目'],
      en: ['Open source libraries/frameworks that allow closed-source usage', 'Libraries that want to stay open without forcing users to open-source', 'API/SDK projects'],
    },
    examples: [
      { name: 'FFmpeg', url: 'https://github.com/FFmpeg/FFmpeg' },
      { name: 'Qt', url: 'https://www.qt.io/' },
      { name: 'LAME MP3', url: 'https://lame.sourceforge.io/' },
      { name: 'GNU Classpath', url: 'https://www.gnu.org/software/classpath/' },
    ],
    text: `                   GNU LESSER GENERAL PUBLIC LICENSE
                       Version 3, 29 June 2007

  Copyright (C) 2007 Free Software Foundation, Inc. <https://fsf.org/>
  Everyone is permitted to copy and distribute verbatim copies
  of this license document, but changing it is not allowed.

  This version of the GNU Lesser General Public License incorporates
the terms and conditions of version 3 of the GNU General Public
License, supplemented by the additional permissions listed below.

  For the complete license text, please visit: https://www.gnu.org/licenses/lgpl-3.0.txt

  Copyright (C) {year} {name}

  This library is free software; you can redistribute it and/or
  modify it under the terms of the GNU Lesser General Public
  License as published by the Free Software Foundation; either
  version 3 of the License, or (at your option) any later version.

  This library is distributed in the hope that it will be useful,
  but WITHOUT ANY WARRANTY; without even the implied warranty of
  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
  Lesser General Public License for more details.

  You should have received a copy of the GNU Lesser General Public
  License along with this library; if not, see
  <https://www.gnu.org/licenses/>.`,
  },
  {
    id: 'bsd-2-clause', spdx: 'BSD-2-Clause', type: 'permissive',
    permissions: ['commercial-use', 'modification', 'distribution', 'private-use'],
    limitations: ['liability', 'warranty'],
    conditions: ['include-copyright', 'include-license'],
    bestFor: {
      zh: ['与 MIT 类似，措辞略有不同', '学术项目和研究代码', 'FreeBSD 生态项目'],
      en: ['Similar to MIT with slightly different wording', 'Academic projects and research code', 'FreeBSD ecosystem projects'],
    },
    examples: [
      { name: 'FreeBSD', url: 'https://www.freebsd.org/' },
      { name: 'Nginx', url: 'https://github.com/nginx/nginx' },
      { name: 'Flask', url: 'https://github.com/pallets/flask' },
      { name: 'Django (BSD)', url: 'https://github.com/django/django' },
    ],
    text: `BSD 2-Clause License

Copyright (c) {year} {name}

Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions are met:

1. Redistributions of source code must retain the above copyright notice,
   this list of conditions and the following disclaimer.

2. Redistributions in binary form must reproduce the above copyright notice,
   this list of conditions and the following disclaimer in the documentation
   and/or other materials provided with the distribution.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE
FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER
CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY,
OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.`,
  },
  {
    id: 'bsd-3-clause', spdx: 'BSD-3-Clause', type: 'permissive',
    permissions: ['commercial-use', 'modification', 'distribution', 'private-use'],
    limitations: ['liability', 'warranty'],
    conditions: ['include-copyright', 'include-license', 'no-endorsement'],
    bestFor: {
      zh: ['比 BSD 2-Clause 多一条「不得用原作者名义推广」', '学术和研究项目', '需要明确禁止背书条款的项目'],
      en: ['Adds "no endorsement" clause to BSD 2-Clause', 'Academic and research projects', 'Projects needing explicit endorsement prohibition'],
    },
    examples: [
      { name: 'Django', url: 'https://github.com/django/django' },
      { name: 'Bootstrap', url: 'https://github.com/twbs/bootstrap' },
      { name: 'Vue Router', url: 'https://github.com/vuejs/router' },
      { name: 'Google Go', url: 'https://github.com/golang/go' },
    ],
    text: `BSD 3-Clause License

Copyright (c) {year} {name}

Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions are met:

1. Redistributions of source code must retain the above copyright notice,
   this list of conditions and the following disclaimer.

2. Redistributions in binary form must reproduce the above copyright notice,
   this list of conditions and the following disclaimer in the documentation
   and/or other materials provided with the distribution.

3. Neither the name of the copyright holder nor the names of its
   contributors may be used to endorse or promote products derived from
   this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE
FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER
CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY,
OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.`,
  },
  {
    id: 'mpl-2.0', spdx: 'MPL-2.0', type: 'weak-copyleft',
    permissions: ['commercial-use', 'modification', 'distribution', 'patent-use', 'private-use'],
    limitations: ['liability', 'warranty'],
    conditions: ['include-copyright', 'include-license', 'disclose-source', 'same-license-files'],
    bestFor: {
      zh: ['文件级 copyleft：修改的文件必须开源，但可与闭源代码组合', '浏览器扩展、中间件', '希望平衡开源与商业使用的项目'],
      en: ['File-level copyleft: modified files must stay open, but can combine with closed source', 'Browser extensions, middleware', 'Projects balancing open source and commercial use'],
    },
    examples: [
      { name: 'Firefox', url: 'https://github.com/nicedoc/firefox' },
      { name: 'Thunderbird', url: 'https://github.com/nicedoc/thunderbird' },
      { name: 'LibreOffice', url: 'https://www.libreoffice.org/' },
      { name: 'VLC (MPL parts)', url: 'https://www.videolan.org/' },
    ],
    text: `Mozilla Public License Version 2.0
==================================

1. Definitions
--------------

1.1. "Contributor"
    means each individual or legal entity that creates, contributes to
    the creation of, or owns Covered Software.

1.2. "Contributor Version"
    means the combination of the Contributions of others (if any) used
    by a Contributor and that particular Contributor's Contribution.

1.3. "Contribution"
    means Covered Software of a particular Contributor.

1.4. "Covered Software"
    means Source Code Form to which the initial Contributor has attached
    the notice in Exhibit A, the Executable Form of such Source Code
    Form, and Modifications of such Source Code Form, in each case
    including portions thereof.

1.5. "Incompatible With Secondary Licenses"
    means

    (a) that the initial Contributor has attached the notice described
        in Exhibit B to the Covered Software; or

    (b) that the Covered Software was made available under the terms of
        version 1.1 or earlier of the License, but not also under the
        terms of a Secondary License.

1.6. "Executable Form"
    means any form of the work other than Source Code Form.

1.7. "Larger Work"
    means a work that combines Covered Software with other material, in
    a separate file or files, that is not Covered Software.

1.8. "License"
    means this document.

1.9. "Licensable"
    means having the right to grant, to the maximum extent possible,
    whether at the time of the initial grant or subsequently, any and
    all of the rights conveyed by this License.

1.10. "Modifications"
    means any of the following:

    (a) any file in Source Code Form that results from an addition to,
        deletion from, or modification of the contents of Covered
        Software; or

    (b) any new file in Source Code Form that contains any Covered
        Software.

1.11. "Patent Claims" of a Contributor
    means any patent claim(s), including without limitation, method,
    process, and apparatus claims, in any patent Licensable by such
    Contributor that would be infringed, but for the grant of the
    License, by the making, using, selling, offering for sale, having
    made, import, or transfer of either its Contributions or its
    Contributor Version.

1.12. "Secondary License"
    means either the GNU General Public License, Version 2.0, the GNU
    Lesser General Public License, Version 2.1, the GNU Affero General
    Public License, Version 3.0, or any later versions of those
    licenses.

1.13. "Source Code Form"
    means the form of the work preferred for making modifications.

1.14. "You" (or "Your")
    means an individual or a legal entity exercising rights under this
    License. For legal entities, "You" includes any entity that
    controls, is controlled by, or is under common control with You. For
    purposes of this definition, "control" means (a) the power, direct
    or indirect, to cause the direction or management of such entity,
    whether by contract or otherwise, or (b) ownership of more than
    fifty percent (50%) of the outstanding shares or beneficial
    ownership of such entity.

For the complete license text, please visit: https://www.mozilla.org/en-US/MPL/2.0/

Copyright (C) {year} {name}

This Source Code Form is subject to the terms of the Mozilla Public
License, v. 2.0. If a copy of the MPL was not distributed with this
file, You can obtain one at https://mozilla.org/MPL/2.0/.`,
  },
  {
    id: 'agpl-3.0', spdx: 'AGPL-3.0', type: 'copyleft',
    permissions: ['commercial-use', 'modification', 'distribution', 'patent-use', 'private-use'],
    limitations: ['liability', 'warranty'],
    conditions: ['include-copyright', 'include-license', 'state-changes', 'disclose-source', 'same-license', 'network-use'],
    bestFor: {
      zh: ['SaaS / 网络服务：用户通过网络使用也算分发', '不希望闭源 SaaS 免费搭便车的项目', '服务器端开源软件'],
      en: ['SaaS / network services: network use counts as distribution', 'Projects that want to prevent closed-source SaaS free-riding', 'Server-side open source software'],
    },
    examples: [
      { name: 'Nextcloud', url: 'https://github.com/nextcloud/server' },
      { name: 'Gitea', url: 'https://github.com/go-gitea/gitea' },
      { name: 'Mastodon', url: 'https://github.com/mastodon/mastodon' },
      { name: 'MongoDB (pre-SSPL)', url: 'https://www.mongodb.com/' },
      { name: 'Jitsi', url: 'https://github.com/jitsi/jitsi-meet' },
    ],
    text: `                    GNU AFFERO GENERAL PUBLIC LICENSE
                       Version 3, 19 November 2007

 Copyright (C) 2007 Free Software Foundation, Inc. <https://fsf.org/>
 Everyone is permitted to copy and distribute verbatim copies
 of this license document, but changing it is not allowed.

                            Preamble

  The GNU Affero General Public License is a free, copyleft license for
software and other kinds of works, specifically designed to ensure
cooperation with the community in the case of network server software.

  The licenses for most software and other practical works are designed
to take away your freedom to share and change the works.  By contrast,
our General Public Licenses are intended to guarantee your freedom to
share and change all versions of a program--to make sure it remains free
software for all its users.

  For the complete license text, please visit: https://www.gnu.org/licenses/agpl-3.0.txt

  Copyright (C) {year} {name}

  This program is free software: you can redistribute it and/or modify
  it under the terms of the GNU Affero General Public License as published
  by the Free Software Foundation, either version 3 of the License, or
  (at your option) any later version.

  This program is distributed in the hope that it will be useful,
  but WITHOUT ANY WARRANTY; without even the implied warranty of
  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
  GNU Affero General Public License for more details.

  You should have received a copy of the GNU Affero General Public License
  along with this program.  If not, see <https://www.gnu.org/licenses/>.`,
  },
  {
    id: 'isc', spdx: 'ISC', type: 'permissive',
    permissions: ['commercial-use', 'modification', 'distribution', 'private-use'],
    limitations: ['liability', 'warranty'],
    conditions: ['include-copyright', 'include-license'],
    bestFor: {
      zh: ['与 MIT 功能等价，措辞更简洁', 'Node.js 生态系统项目', '追求极简许可证文本的项目'],
      en: ['Functionally equivalent to MIT, simpler wording', 'Node.js ecosystem projects', 'Projects preferring minimal license text'],
    },
    examples: [
      { name: 'Node.js', url: 'https://github.com/nodejs/node' },
      { name: 'npm', url: 'https://github.com/npm/cli' },
      { name: 'PostCSS', url: 'https://github.com/postcss/postcss' },
      { name: 'normalize.css', url: 'https://github.com/necolas/normalize.css' },
    ],
    text: `ISC License

Copyright (c) {year} {name}

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted, provided that the above
copyright notice and this permission notice appear in all copies.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES
WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF
MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR
ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES
WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN
ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF
OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.`,
  },
  {
    id: 'unlicense', spdx: 'Unlicense', type: 'public-domain',
    permissions: ['commercial-use', 'modification', 'distribution', 'private-use'],
    limitations: [],
    conditions: [],
    bestFor: {
      zh: ['将代码奉献给公共领域，无任何限制', '示例代码、教学材料和小工具', '希望代码被无条件使用的项目'],
      en: ['Dedicate code to public domain with no restrictions', 'Example code, teaching materials, small tools', 'Projects you want used completely unconditionally'],
    },
    examples: [
      { name: 'SQLite', url: 'https://www.sqlite.org/' },
      { name: 'libuv', url: 'https://github.com/libuv/libuv' },
      { name: 'IcedCoffeeScript', url: 'https://github.com/maxtaco/coffee-script' },
      { name: 'youtube-dl (old)', url: 'https://github.com/ytdl-org/youtube-dl' },
    ],
    text: `This is free and unencumbered software released into the public domain.

Anyone is free to copy, modify, publish, use, compile, sell, or
distribute this software, either in source code form or as a compiled
binary, for any purpose, commercial or non-commercial, and by any
means.

In jurisdictions that recognize copyright laws, the author or authors
of this software dedicate any and all copyright interest in the
software to the public domain. We make this dedication for the benefit
of the public at large and to the detriment of our heirs and
successors. We intend this dedication to be an overt act of
relinquishment in perpetuity of all present and future rights to this
software under copyright law.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS BE LIABLE FOR ANY CLAIM, DAMAGES OR
OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE,
ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
OTHER DEALINGS IN THE SOFTWARE.

For more information, please refer to <https://unlicense.org/>

Copyright (C) {year} {name}`,
  },
];

// ── Permission/condition label maps ──

const PERM_LABELS: Record<string, { zh: string; en: string; icon: string }> = {
  'commercial-use': { zh: '商业使用', en: 'Commercial Use', icon: '✓' },
  'modification': { zh: '修改', en: 'Modification', icon: '✓' },
  'distribution': { zh: '分发', en: 'Distribution', icon: '✓' },
  'patent-use': { zh: '专利使用', en: 'Patent Use', icon: '✓' },
  'private-use': { zh: '私人使用', en: 'Private Use', icon: '✓' },
};

const LIM_LABELS: Record<string, { zh: string; en: string; icon: string }> = {
  'liability': { zh: '免责', en: 'Liability', icon: '✕' },
  'warranty': { zh: '无担保', en: 'Warranty', icon: '✕' },
};

const COND_LABELS: Record<string, { zh: string; en: string; icon: string }> = {
  'include-copyright': { zh: '保留版权声明', en: 'Include Copyright', icon: '●' },
  'include-license': { zh: '包含许可证', en: 'Include License', icon: '●' },
  'state-changes': { zh: '说明修改内容', en: 'State Changes', icon: '●' },
  'disclose-source': { zh: '公开源码', en: 'Disclose Source', icon: '●' },
  'same-license': { zh: '相同许可证', en: 'Same License', icon: '●' },
  'same-license-library': { zh: '库使用相同许可证', en: 'Same License (Library)', icon: '●' },
  'same-license-files': { zh: '修改的文件使用相同许可证', en: 'Same License (Files)', icon: '●' },
  'no-endorsement': { zh: '不得背书', en: 'No Endorsement', icon: '●' },
  'network-use': { zh: '网络使用视为分发', en: 'Network Use = Distribution', icon: '●' },
};

const TYPE_LABELS: Record<string, { zh: string; en: string }> = {
  'permissive': { zh: '宽松', en: 'Permissive' },
  'copyleft': { zh: '强 Copyleft', en: 'Strong Copyleft' },
  'weak-copyleft': { zh: '弱 Copyleft', en: 'Weak Copyleft' },
  'public-domain': { zh: '公共领域', en: 'Public Domain' },
};

// ── Main Component ──

export default function LicenseGenerator() {
  const { lang, t } = useI18n();
  const { name: toolName, desc, ui, help } = useToolI18n('license');
  const [selected, setSelected] = useState<LicenseId>('mit');
  const [authorName, setAuthorName] = useState('');
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [tab, setTab] = useState<'info' | 'text'>('text');
  const [copied, setCopied] = useState(false);

  const license = LICENSES.find((l) => l.id === selected)!;

  const licenseText = useMemo(() => {
    return license.text.replace(/\{year\}/g, year || '[year]').replace(/\{name\}/g, authorName || '[name]');
  }, [license, year, authorName]);

  const copyText = useCallback((text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  }, []);

  const downloadLicense = useCallback(() => {
    const blob = new Blob([licenseText], { type: 'text/plain;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'LICENSE';
    a.click();
    URL.revokeObjectURL(a.href);
  }, [licenseText]);

  return (
    <ToolShell title={toolName} description={desc}>
      <div className="lic-layout">
        {/* Left: License Selector */}
        <div className="lic-selector">
          <div className="lic-selector-title">{ui.selectLicense}</div>
          <div className="lic-grid">
            {LICENSES.map((l) => (
              <button
                key={l.id}
                className={`lic-card${selected === l.id ? ' lic-card-active' : ''}`}
                onClick={() => setSelected(l.id)}
              >
                <div className="lic-card-header">
                  <span className="lic-card-name">{l.spdx}</span>
                  <span className={`lic-type lic-type-${l.type}`}>{lang === 'zh' ? TYPE_LABELS[l.type].zh : TYPE_LABELS[l.type].en}</span>
                </div>
                <div className="lic-card-desc">
                  {lang === 'zh' ? l.bestFor.zh[0] : l.bestFor.en[0]}
                </div>
              </button>
            ))}
          </div>

          <div className="lic-fields">
            <div className="priv-field">
              <label>{ui.authorName}</label>
              <input className="input-field" value={authorName} onChange={(e) => setAuthorName(e.target.value)} placeholder={ui.authorPlaceholder} />
            </div>
            <div className="priv-field">
              <label>{ui.year}</label>
              <input className="input-field" value={year} onChange={(e) => setYear(e.target.value)} placeholder="2026" />
            </div>
          </div>
        </div>

        {/* Right: Output */}
        <div className="tool-panel">
          <div className="panel-header">
            <div className="lic-tabs">
              <button className={`panel-btn panel-btn-sm${tab === 'text' ? ' accent' : ''}`} onClick={() => setTab('text')}>{ui.licenseText}</button>
              <button className={`panel-btn panel-btn-sm${tab === 'info' ? ' accent' : ''}`} onClick={() => setTab('info')}>{ui.licenseInfo}</button>
            </div>
            <div className="panel-actions">
              {tab === 'text' && (
                <>
                  <button className="panel-btn" onClick={() => copyText(licenseText)}>{copied ? t('common.copied') : t('common.copy')}</button>
                  <button className="panel-btn accent" onClick={downloadLicense}>{ui.downloadLicense}</button>
                </>
              )}
            </div>
          </div>
          <div className="lic-output">
            {tab === 'text' && <pre className="priv-doc">{licenseText}</pre>}
            {tab === 'info' && (
              <div className="lic-info">
                <div className="lic-info-section">
                  <div className="lic-info-title">
                    <span className="lic-type lic-type-sm lic-type-${license.type}">{lang === 'zh' ? TYPE_LABELS[license.type].zh : TYPE_LABELS[license.type].en}</span>
                    <span>{license.spdx}</span>
                  </div>
                </div>

                <div className="lic-info-section">
                  <div className="lic-info-label">{ui.permissions}</div>
                  <div className="lic-badge-row">
                    {license.permissions.map((p) => (
                      <span key={p} className="lic-badge lic-badge-allow" title={PERM_LABELS[p][lang]}>
                        {PERM_LABELS[p].icon} {PERM_LABELS[p][lang]}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="lic-info-section">
                  <div className="lic-info-label">{ui.limitations}</div>
                  <div className="lic-badge-row">
                    {license.limitations.length > 0 ? license.limitations.map((l) => (
                      <span key={l} className="lic-badge lic-badge-deny" title={LIM_LABELS[l][lang]}>
                        {LIM_LABELS[l].icon} {LIM_LABELS[l][lang]}
                      </span>
                    )) : <span className="lic-badge lic-badge-neutral">—</span>}
                  </div>
                </div>

                <div className="lic-info-section">
                  <div className="lic-info-label">{ui.conditions}</div>
                  <div className="lic-badge-row">
                    {license.conditions.length > 0 ? license.conditions.map((c) => (
                      <span key={c} className="lic-badge lic-badge-cond" title={COND_LABELS[c][lang]}>
                        {COND_LABELS[c].icon} {COND_LABELS[c][lang]}
                      </span>
                    )) : <span className="lic-badge lic-badge-neutral">—</span>}
                  </div>
                </div>

                <div className="lic-info-section">
                  <div className="lic-info-label">{ui.bestFor}</div>
                  <ul className="lic-best-for">
                    {(lang === 'zh' ? license.bestFor.zh : license.bestFor.en).map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>
                </div>

                <div className="lic-info-section">
                  <div className="lic-info-label">{ui.examples}</div>
                  <div className="lic-examples">
                    {license.examples.map((ex) => (
                      <a key={ex.name} href={ex.url} target="_blank" rel="noopener noreferrer" className="lic-example-link">
                        {ex.name} <span className="priv-ref-ext">↗</span>
                      </a>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      {help && <HelpSection title={help.title} features={help.features} usage={help.usage} />}
    </ToolShell>
  );
}
