local successName, GameInfo = pcall(function() return game:GetService("MarketplaceService"):GetProductInfo(game.PlaceId) end)
local GameName = successName and GameInfo.Name or "Racket Rivals"

-- [[ LIBRARY LOADER ]] --
local success, OSX = pcall(function()
    return loadstring(readfile("OSX_Lib.lua"))()
end)

if not success then
    warn("OSX: Local file not found, loading from GitHub...")
    OSX = loadstring(game:HttpGet("https://raw.githubusercontent.com/yxucnx/OSX-HUB-Lib/refs/heads/main/OSX_Lib.lua?v=" .. tick()))()
end


-- [[ UI INITIALIZATION ]] --
local Window = OSX:CreateWindow({
    Title = "OSX HUB | " .. GameName,
    Subtitle = "Made by: LilYouDev1997 | Discord: discord.gg/osxhub",
    WindowLogo = "https://img2.pic.in.th/logo512v2.png",
    FloatingLogo = "https://img1.pic.in.th/images/logo512v1.png",
    ToggleKey = Enum.KeyCode.RightControl
})

-- [[ TABS ]] --
local Tabs = {
    Info = Window:AddTab({ Title = "Info", SubDescription = "Information", Icon = "info" }),
    Main = Window:AddTab({ Title = "Player", Icon = "user", SubDescription = "Movement & Speed" }),
    Visuals = Window:AddTab({ Title = "Visuals", Icon = "eye", SubDescription = "ESP & Lighting" }),
    Combat = Window:AddTab({ Title = "Combat", Icon = "sword", SubDescription = "Attacks" }),
    Teleport = Window:AddTab({ Title = "Teleport", Icon = "map", SubDescription = "Map Navigation" }),
    Misc = Window:AddTab({ Title = "Misc", Icon = "component", SubDescription = "Optimization & AFK" })
}

local InfoPanel = Tabs.Info:AddPanel("Information")
InfoPanel:AddInfoLabel("Owner:", "Darkmxde.")
InfoPanel:AddInfoLabel("Developer Main:", "0b1100001cat")
InfoPanel:AddInfoLabel("Developer Backup:", "LilYouDev1997x")
InfoPanel:AddInfoLabel("Discord:", "https://discord.gg/osxhub")
InfoPanel:AddInfoLabel("Update:", "05/10/2026")

InfoPanel:AddWideButton({
    Title = "Discord Server",
    Callback = function() pcall(function() setclipboard("https://discord.gg/osxhub") end) end
})

-- [[ SERVICES ]] --
local Workspace = game:GetService("Workspace")
local Players = game:GetService("Players")
local RunService = game:GetService("RunService")
local Lighting = game:GetService("Lighting")

-- [[ LIGHTING SYSTEM (FULL BRIGHT) ]] --
local originalBrightness = Lighting.Brightness
local originalOutdoorAmbient = Lighting.OutdoorAmbient
local originalAmbient = Lighting.Ambient
local originalGlobalShadows = Lighting.GlobalShadows

local function applyFullBrightness()
    Lighting.Brightness = 2
    Lighting.OutdoorAmbient = Color3.fromRGB(255, 255, 255)
    Lighting.Ambient = Color3.fromRGB(255, 255, 255)
    Lighting.GlobalShadows = false
end

local function removeFullBrightness()
    Lighting.Brightness = originalBrightness
    Lighting.OutdoorAmbient = originalOutdoorAmbient
    Lighting.Ambient = originalAmbient
    Lighting.GlobalShadows = originalGlobalShadows
end

-- [[ ESP MOBS LOGIC ]] --
local ActiveEspMobs = false
local ActiveEspMobNames = false
local spawnedHighlights = setmetatable({}, { __mode = "k" })
local spawnedBillboards = setmetatable({}, { __mode = "k" })
local mobConnections = {}

local function RemoveMobHighlight(mob)
    if spawnedHighlights[mob] then
        pcall(function() spawnedHighlights[mob]:Destroy() end)
        spawnedHighlights[mob] = nil
    end
    local folder = mob:FindFirstChild("Mob_Chams")
    if folder then
        pcall(function() folder:Destroy() end)
    end
end

local function CreateMobHighlight(mob)
    if not mob:IsA("Model") then return end
    if Players:GetPlayerFromCharacter(mob) then return end -- กรองเฉพาะมอนสเตอร์ ไม่รวมผู้เล่น
    
    -- ลบอันเดิมก่อน
    RemoveMobHighlight(mob)
    
    local folder = Instance.new("Folder")
    folder.Name = "Mob_Chams"
    
    local function setupPart(part)
        if part:IsA("BasePart") then
            local adorn = Instance.new("BoxHandleAdornment")
            adorn.Name = "Cham"
            adorn.Size = (ActiveHeadHitbox and part.Name == "Head") and Vector3.new(5, 5, 5) or part.Size
            adorn.Adornee = part
            adorn.AlwaysOnTop = true
            adorn.ZIndex = 5
            adorn.Color3 = Color3.fromRGB(255, 60, 60)
            adorn.Transparency = 0.5
            adorn.Parent = folder
        end
    end

    for _, part in pairs(mob:GetChildren()) do
        setupPart(part)
    end
    
    folder.Parent = mob
    spawnedHighlights[mob] = folder
end

local function CreateMobName(mob)
    if not mob:IsA("Model") then return end
    if Players:GetPlayerFromCharacter(mob) then return end -- กรองเฉพาะมอนสเตอร์ ไม่รวมผู้เล่น
    
    task.spawn(function()
        local head = mob:WaitForChild("Head", 5) or mob:FindFirstChildWhichIsA("BasePart") or mob.PrimaryPart
        if not head then
            task.wait(1)
            head = mob:FindFirstChild("Head") or mob:FindFirstChildWhichIsA("BasePart") or mob.PrimaryPart
        end
        if not head or not mob.Parent then return end
        if not ActiveEspMobNames then return end
        if spawnedBillboards[mob] then return end
        
        -- ลบป้ายเก่าออกก่อนเพื่อไม่ให้ซ้ำซ้อน
        local existing = head:FindFirstChild("Mob_ESP")
        if existing then
            pcall(function() existing:Destroy() end)
        end

        local billboard = Instance.new("BillboardGui")
        billboard.Name = "Mob_ESP"
        billboard.Size = UDim2.new(0, 100, 0, 20)
        billboard.AlwaysOnTop = true
        billboard.StudsOffset = Vector3.new(0, 1.5, 0)
        billboard.Adornee = head
        billboard.Enabled = true
        billboard.Parent = head
        
        local label = Instance.new("TextLabel")
        label.Size = UDim2.new(1, 0, 1, 0)
        label.BackgroundTransparency = 1
        label.Text = mob.Name
        label.TextColor3 = Color3.fromRGB(255, 60, 60)
        label.TextSize = 10 -- ขนาดเล็กเพื่อไม่ให้รกหน้าจอ
        label.TextScaled = false
        label.Font = Enum.Font.SourceSansBold
        label.TextStrokeColor3 = Color3.fromRGB(0, 0, 0)
        label.TextStrokeTransparency = 0.2
        label.Parent = billboard
        
        spawnedBillboards[mob] = billboard
    end)
end

local function RemoveMobName(mob)
    if spawnedBillboards[mob] then
        pcall(function() spawnedBillboards[mob]:Destroy() end)
        spawnedBillboards[mob] = nil
    end
    local head = mob:FindFirstChild("Head") or mob:FindFirstChildWhichIsA("BasePart")
    if head then
        local bb = head:FindFirstChild("Mob_ESP")
        if bb then
            pcall(function() bb:Destroy() end)
        end
    end
end

-- [[ COMBAT (HEAD HITBOX) LOGIC ]] --
local ActiveHeadHitbox = false
local originalHeadSizes = setmetatable({}, { __mode = "k" })
local originalHeadTransparencies = setmetatable({}, { __mode = "k" })
local originalHeadCollisions = setmetatable({}, { __mode = "k" })
local originalHeadMeshScales = setmetatable({}, { __mode = "k" })
local headConnections = setmetatable({}, { __mode = "k" })

local function ApplyHeadHitbox(mob)
    if not mob:IsA("Model") then return end
    if Players:GetPlayerFromCharacter(mob) then return end -- กรองเฉพาะมอนสเตอร์ ไม่รวมผู้เล่น
    
    task.spawn(function()
        local head = mob:FindFirstChild("Head") or mob:WaitForChild("Head", 5)
        if not ActiveHeadHitbox then return end
        if head and head:IsA("BasePart") and mob.Parent then
            if not originalHeadSizes[mob] then
                originalHeadSizes[mob] = head.Size
                originalHeadTransparencies[mob] = head.Transparency
                originalHeadCollisions[mob] = head.CanCollide
            end

            local mesh = head:FindFirstChildOfClass("SpecialMesh")
            if mesh and not originalHeadMeshScales[mob] then
                originalHeadMeshScales[mob] = mesh.Scale
            end

            -- ขยายขนาดหัวและปรับแต่งคุณสมบัติ
            head.Size = Vector3.new(5, 5, 5)
            head.Transparency = 0.6
            head.CanCollide = false
            if mesh then
                mesh.Scale = Vector3.new(5, 5, 5)
            end

            -- สร้างกล่อง Visual Hitbox เด่นชัด (สีฟ้าโปร่งใส มองทะลุหมวก/เครื่องประดับได้)
            local visual = head:FindFirstChild("HeadHitboxVisual")
            if not visual then
                visual = Instance.new("BoxHandleAdornment")
                visual.Name = "HeadHitboxVisual"
                visual.Adornee = head
                visual.AlwaysOnTop = true
                visual.ZIndex = 8
                visual.Color3 = Color3.fromRGB(0, 200, 255)
                visual.Transparency = 0.5
                visual.Size = Vector3.new(5, 5, 5)
                visual.Parent = head
            else
                visual.Size = Vector3.new(5, 5, 5)
            end

            -- ซิงค์ขนาดกับ Mob_Chams หากเปิด ESP MOBS อยู่
            local mobChams = mob:FindFirstChild("Mob_Chams")
            if mobChams then
                for _, adorn in pairs(mobChams:GetChildren()) do
                    if adorn:IsA("BoxHandleAdornment") and adorn.Adornee == head then
                        adorn.Size = Vector3.new(5, 5, 5)
                    end
                end
            end

            -- ล็อกขนาดหัวไว้ ป้องกันเกมหรือสคริปต์แอนิเมชันรีเซ็ตกลับ
            if headConnections[mob] then
                pcall(function() headConnections[mob]:Disconnect() end)
                headConnections[mob] = nil
            end

            headConnections[mob] = head:GetPropertyChangedSignal("Size"):Connect(function()
                if ActiveHeadHitbox and head.Parent and head.Size ~= Vector3.new(5, 5, 5) then
                    head.Size = Vector3.new(5, 5, 5)
                    head.CanCollide = false
                    if mesh then
                        mesh.Scale = Vector3.new(5, 5, 5)
                    end
                end
            end)
        end
    end)
end

local function ResetHeadHitbox(mob)
    if headConnections[mob] then
        pcall(function() headConnections[mob]:Disconnect() end)
        headConnections[mob] = nil
    end

    local head = mob:FindFirstChild("Head")
    if head and head:IsA("BasePart") then
        local visual = head:FindFirstChild("HeadHitboxVisual")
        if visual then
            pcall(function() visual:Destroy() end)
        end

        local mesh = head:FindFirstChildOfClass("SpecialMesh")
        if mesh and originalHeadMeshScales[mob] then
            mesh.Scale = originalHeadMeshScales[mob]
        end

        if originalHeadSizes[mob] then
            head.Size = originalHeadSizes[mob]
            head.Transparency = originalHeadTransparencies[mob] or 0
            head.CanCollide = originalHeadCollisions[mob] ~= false
        end

        -- คืนขนาดกล่อง Mob_Chams เดิมหากมีอยู่
        local mobChams = mob:FindFirstChild("Mob_Chams")
        if mobChams and originalHeadSizes[mob] then
            for _, adorn in pairs(mobChams:GetChildren()) do
                if adorn:IsA("BoxHandleAdornment") and adorn.Adornee == head then
                    adorn.Size = originalHeadSizes[mob]
                end
            end
        end
    end

    originalHeadSizes[mob] = nil
    originalHeadTransparencies[mob] = nil
    originalHeadCollisions[mob] = nil
    originalHeadMeshScales[mob] = nil
end

local function UpdateMobConnections()
    -- Disconnect old connections safely to prevent duplicate events or dead listeners
    if mobConnections.ChildAdded then
        pcall(function() mobConnections.ChildAdded:Disconnect() end)
        mobConnections.ChildAdded = nil
    end
    if mobConnections.ChildRemoved then
        pcall(function() mobConnections.ChildRemoved:Disconnect() end)
        mobConnections.ChildRemoved = nil
    end

    local charactersFolder = Workspace:FindFirstChild("Characters")
    if not charactersFolder then return end

    if ActiveEspMobs or ActiveEspMobNames or ActiveHeadHitbox then
        mobConnections.ChildAdded = charactersFolder.ChildAdded:Connect(function(mob)
            task.wait(0.1)
            if ActiveEspMobs then
                CreateMobHighlight(mob)
            end
            if ActiveEspMobNames then
                CreateMobName(mob)
            end
            if ActiveHeadHitbox then
                ApplyHeadHitbox(mob)
            end
        end)
        
        mobConnections.ChildRemoved = charactersFolder.ChildRemoved:Connect(function(mob)
            RemoveMobHighlight(mob)
            RemoveMobName(mob)
            if headConnections[mob] then
                pcall(function() headConnections[mob]:Disconnect() end)
                headConnections[mob] = nil
            end
            originalHeadSizes[mob] = nil
            originalHeadTransparencies[mob] = nil
            originalHeadCollisions[mob] = nil
            originalHeadMeshScales[mob] = nil
        end)
    end
end

-- Monitor Characters folder creation and destruction to handle map changes and round restarts
local function MonitorCharactersFolder()
    if mobConnections.FolderAdded then
        pcall(function() mobConnections.FolderAdded:Disconnect() end)
        mobConnections.FolderAdded = nil
    end
    if mobConnections.FolderRemoved then
        pcall(function() mobConnections.FolderRemoved:Disconnect() end)
        mobConnections.FolderRemoved = nil
    end

    local function onFolderAdded(folder)
        if folder.Name == "Characters" then
            task.wait(0.5)
            
            -- Re-connect mob events to the new folder
            UpdateMobConnections()
            
            -- If active, apply to existing mobs immediately
            local charactersFolder = Workspace:FindFirstChild("Characters")
            if charactersFolder then
                for _, mob in pairs(charactersFolder:GetChildren()) do
                    if ActiveEspMobs then CreateMobHighlight(mob) end
                    if ActiveEspMobNames then CreateMobName(mob) end
                    if ActiveHeadHitbox then ApplyHeadHitbox(mob) end
                end
            end
        end
    end

    local function onFolderRemoved(folder)
        if folder.Name == "Characters" then
            -- Clean up references to destroyed mobs to prevent memory leaks
            for mob, _ in pairs(spawnedHighlights) do RemoveMobHighlight(mob) end
            for mob, _ in pairs(spawnedBillboards) do RemoveMobName(mob) end
            
            for mob, conn in pairs(headConnections) do
                pcall(function() conn:Disconnect() end)
            end
            table.clear(headConnections)
            table.clear(originalHeadSizes)
            table.clear(originalHeadTransparencies)
            table.clear(originalHeadCollisions)
            table.clear(originalHeadMeshScales)

            UpdateMobConnections()
        end
    end

    mobConnections.FolderAdded = Workspace.ChildAdded:Connect(onFolderAdded)
    mobConnections.FolderRemoved = Workspace.ChildRemoved:Connect(onFolderRemoved)
end

-- Start monitoring Characters folder
MonitorCharactersFolder()

-- [[ ESP PLAYERS LOGIC ]] --
local ActiveEspPlayers = false
local playerSpawnedHighlights = setmetatable({}, { __mode = "k" })
local playerConnections = {}

local function CreatePlayerEsp(player)
    if player == Players.LocalPlayer then return end
    
    local function highlightChar(char)
        if not char then return end
        
        -- Clean up existing player highlights inside this character to prevent duplication
        local existing = char:FindFirstChild("Player_Chams")
        if existing then
            pcall(function() existing:Destroy() end)
        end
        
        local folder = Instance.new("Folder")
        folder.Name = "Player_Chams"
        
        local function setupPart(part)
            if part:IsA("BasePart") and part.Name ~= "HumanoidRootPart" then
                local adorn = Instance.new("BoxHandleAdornment")
                adorn.Name = "Cham"
                adorn.Size = part.Size
                adorn.Adornee = part
                adorn.AlwaysOnTop = true
                adorn.ZIndex = 5
                adorn.Color3 = Color3.fromRGB(0, 255, 120)
                adorn.Transparency = 0.5
                adorn.Parent = folder
            end
        end

        for _, part in pairs(char:GetChildren()) do
            setupPart(part)
        end
        
        folder.Parent = char
        playerSpawnedHighlights[char] = folder
    end
    
    if player.Character then
        highlightChar(player.Character)
    end
    
    playerConnections[player.UserId .. "_added"] = player.CharacterAdded:Connect(function(char)
        task.wait(0.1)
        if ActiveEspPlayers then
            highlightChar(char)
        end
    end)
    
    playerConnections[player.UserId .. "_removing"] = player.CharacterRemoving:Connect(function(char)
        if playerSpawnedHighlights[char] then
            pcall(function() playerSpawnedHighlights[char]:Destroy() end)
            playerSpawnedHighlights[char] = nil
        end
    end)
end

local function RemovePlayerEsp(player)
    if player.Character and playerSpawnedHighlights[player.Character] then
        pcall(function() playerSpawnedHighlights[player.Character]:Destroy() end)
        playerSpawnedHighlights[player.Character] = nil
    end
    if player.Character then
        local folder = player.Character:FindFirstChild("Player_Chams")
        if folder then
            pcall(function() folder:Destroy() end)
        end
    end
    if playerConnections[player.UserId .. "_added"] then
        playerConnections[player.UserId .. "_added"]:Disconnect()
        playerConnections[player.UserId .. "_added"] = nil
    end
    if playerConnections[player.UserId .. "_removing"] then
        playerConnections[player.UserId .. "_removing"]:Disconnect()
        playerConnections[player.UserId .. "_removing"] = nil
    end
end

-- [[ VISUALS TAB PANELS ]] --
local EspPanel = Tabs.Visuals:AddPanel("ESP Features")

EspPanel:AddToggle({
    Title = "ESP MOBS",
    Description = "แสดงไฮไลท์มอนสเตอร์ในแมพ",
    Default = false,
    Callback = function(Value)
        ActiveEspMobs = Value
        if ActiveEspMobs then
            local charactersFolder = Workspace:FindFirstChild("Characters")
            if charactersFolder then
                for _, mob in pairs(charactersFolder:GetChildren()) do
                    CreateMobHighlight(mob)
                end
            end
            UpdateMobConnections()
        else
            local charactersFolder = Workspace:FindFirstChild("Characters")
            if charactersFolder then
                for _, mob in pairs(charactersFolder:GetChildren()) do
                    RemoveMobHighlight(mob)
                end
            end
            for mob, _ in pairs(spawnedHighlights) do
                RemoveMobHighlight(mob)
            end
            UpdateMobConnections()
        end
    end
})

EspPanel:AddToggle({
    Title = "ESP MOB NAMES",
    Description = "แสดงชื่อบนมอนสเตอร์ในแมพ",
    Default = false,
    Callback = function(Value)
        ActiveEspMobNames = Value
        if ActiveEspMobNames then
            local charactersFolder = Workspace:FindFirstChild("Characters")
            if charactersFolder then
                for _, mob in pairs(charactersFolder:GetChildren()) do
                    CreateMobName(mob)
                end
            end
            UpdateMobConnections()
        else
            local charactersFolder = Workspace:FindFirstChild("Characters")
            if charactersFolder then
                for _, mob in pairs(charactersFolder:GetChildren()) do
                    RemoveMobName(mob)
                end
            end
            for mob, _ in pairs(spawnedBillboards) do
                RemoveMobName(mob)
            end
            UpdateMobConnections()
        end
    end
})

EspPanel:AddToggle({
    Title = "ESP PLAYERS",
    Description = "แสดงไฮไลท์ผู้เล่นคนอื่นในเซิร์ฟเวอร์",
    Default = false,
    Callback = function(Value)
        ActiveEspPlayers = Value
        if ActiveEspPlayers then
            for _, plr in pairs(Players:GetPlayers()) do
                CreatePlayerEsp(plr)
            end
            
            playerConnections.PlayerAdded = Players.PlayerAdded:Connect(function(plr)
                if ActiveEspPlayers then
                    CreatePlayerEsp(plr)
                end
            end)
            
            playerConnections.PlayerRemoving = Players.PlayerRemoving:Connect(function(plr)
                RemovePlayerEsp(plr)
            end)
        else
            if playerConnections.PlayerAdded then
                playerConnections.PlayerAdded:Disconnect()
                playerConnections.PlayerAdded = nil
            end
            if playerConnections.PlayerRemoving then
                playerConnections.PlayerRemoving:Disconnect()
                playerConnections.PlayerRemoving = nil
            end
            
            for _, plr in pairs(Players:GetPlayers()) do
                RemovePlayerEsp(plr)
            end
            
            -- Fallback clean up
            for char, highlight in pairs(playerSpawnedHighlights) do
                pcall(function() highlight:Destroy() end)
            end
            playerSpawnedHighlights = setmetatable({}, { __mode = "k" })
        end
    end
})

local LightPanel = Tabs.Visuals:AddPanel("Lighting & Visibility")

LightPanel:AddToggle({
    Title = "Full Bright",
    Description = "เพิ่มความสว่างสูงสุดเพื่อให้มองเห็นในที่มืด",
    Default = false,
    Callback = function(Value)
        if Value then
            applyFullBrightness()
        else
            removeFullBrightness()
        end
    end
})


-- [[ WEAPON MODIFICATIONS LOGIC ]] --
local ActiveNoRecoil = false
local ActiveNoSpread = false
local ActiveRapidFire = false
local ActiveInfiniteAmmo = false

local weaponOriginals = setmetatable({}, { __mode = "k" })
local weaponListeners = {}

-- ป้องกันข้อผิดพลาด `arithmetic on nil and Vector3` ในระบบสปริงของตัวเกม
pcall(function()
    local SpringModule = require(game:GetService("ReplicatedStorage"):WaitForChild("Assets"):WaitForChild("Modules"):WaitForChild("Spring"))
    if SpringModule and SpringModule.spring and SpringModule.spring.Accelerate then
        local origAccelerate = SpringModule.spring.Accelerate
        SpringModule.spring.Accelerate = function(self, accel, ...)
            if not self.Velocity then self.Velocity = Vector3.zero end
            if not self.Position then self.Position = Vector3.zero end
            return origAccelerate(self, accel, ...)
        end
    end
end)

-- [[ INTERCEPT CAMERA RECOIL ("camspring") ]] --
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local EventsFolder = ReplicatedStorage:FindFirstChild("Events")
local clientBindable = EventsFolder and EventsFolder:FindFirstChild("client")
local camSpringRef = nil

local function getCameraSpring()
    if camSpringRef then return camSpringRef end
    if not (clientBindable and getconnections and getupvalues) then return nil end
    pcall(function()
        for _, conn in ipairs(getconnections(clientBindable.Event)) do
            local fn = conn.Function
            if fn then
                local upvals = getupvalues(fn)
                for _, uv in pairs(upvals) do
                    if type(uv) == "table" and (uv.Accelerate or (uv.d and uv.s)) then
                        camSpringRef = uv
                        return
                    end
                end
            end
        end
    end)
    return camSpringRef
end

-- Intercept 1: __namecall
if hookmetamethod and clientBindable then
    local oldNamecall
    oldNamecall = hookmetamethod(game, "__namecall", function(self, ...)
        local method = getnamecallmethod()
        if ActiveNoRecoil and (method == "Fire" or method == "fire") and self == clientBindable then
            local args = { ... }
            if args[1] == "camspring" then
                return -- ตัดแรงดีดกล้องออกทันที ปืนยิงนิ่งสนิท 100%
            end
        end
        return oldNamecall(self, ...)
    end)
end

-- Intercept 2: hookfunction on Fire method
if clientBindable and type(hookfunction) == "function" then
    local oldFire
    oldFire = hookfunction(clientBindable.Fire, function(self, ...)
        if ActiveNoRecoil then
            local args = { ... }
            if args[1] == "camspring" then
                return
            end
        end
        return oldFire(self, ...)
    end)
end

-- Intercept 3: RenderStepped Spring Zeroing
RunService.RenderStepped:Connect(function()
    if ActiveNoRecoil then
        local cs = getCameraSpring()
        if cs then
            if cs.Position then cs.Position = Vector3.zero end
            if cs.Velocity then cs.Velocity = Vector3.zero end
        end
    end
end)

local function isWeaponConfig(tbl)
    return type(tbl) == "table" and tbl.ammo ~= nil and tbl.fire ~= nil
end

local function findWeaponConfig(item)
    if not item or not (item:IsA("Tool") or item:IsA("Model")) then return nil end
    for _, child in ipairs(item:GetChildren()) do
        if child:IsA("ModuleScript") and child.Name ~= "Spring" and child.Name ~= "Controller" then
            local success, result = pcall(require, child)
            if success and isWeaponConfig(result) then
                return result, child
            end
        end
    end
    for _, desc in ipairs(item:GetDescendants()) do
        if desc:IsA("ModuleScript") and desc.Name ~= "Spring" and desc.Name ~= "Controller" then
            local success, result = pcall(require, desc)
            if success and isWeaponConfig(result) then
                return result, desc
            end
        end
    end
    return nil
end

-- ฟื้นฟูค่าที่อาจถูกแก้เป็น 0 จากสคริปต์เวอร์ชันก่อนหน้า เพื่อให้ Client ของปืนทำงานได้เต็ม 100% ไม่พังและดาเมจออกปกติ
local function healWeaponConfig(config)
    if not config or not config.fire then return end

    if config.fire.aimFireWeight == nil or config.fire.aimFireWeight <= 0 then
        config.fire.aimFireWeight = 0.45
    end

    if config.fire.recoil then
        local r = config.fire.recoil
        if r.damper == nil or r.damper <= 0 then r.damper = 0.8 end
        if r.speed == nil or r.speed <= 0 then r.speed = 13 end
        if r.recoilBackSize == nil or r.recoilBackSize <= 0 then r.recoilBackSize = 1.1 end
        if type(r.x) == "table" and r.x[1] == 0 and r.x[2] == 0 then r.x = { -5, 5 } end
        if type(r.y) == "table" and r.y[1] == 0 and r.y[2] == 0 then r.y = { 11, 13 } end
        if type(r.z) == "table" and r.z[1] == 0 and r.z[2] == 0 then r.z = { -65, 65 } end
    end
end

local function backupWeaponOriginals(config)
    healWeaponConfig(config)
    if weaponOriginals[config] then return end

    local orig = {}
    if config.fire then
        orig.spreadFactor = config.fire.spreadFactor
        orig.aimingSpreadFactor = config.fire.aimingSpreadFactor
        orig.fireDelay = config.fire.fireDelay
        orig.burstDelay = config.fire.burstDelay
        orig.boltDelay = config.fire.boltDelay
    end

    if config.ammo then
        orig.infAmmo = config.ammo.infAmmo
    end

    weaponOriginals[config] = orig
end

local function applyModsToConfig(config)
    if not config then return end
    backupWeaponOriginals(config)
    local orig = weaponOriginals[config]

    -- 1. No Recoil: รักษาตาราง recoil ให้สมบูรณ์ ป้องกัน Client Crash โดยจัดการแรงดีดผ่านการตัด Event camspring และ Camera Spring
    healWeaponConfig(config)

    -- 2. No Spread: ปรับตัวคูณการกระจาย (spreadFactor / aimingSpreadFactor) เป็น 0 เพื่อให้กระสุนเกาะกลุ่มตรงกลาง 100% โดยไม่ทำลายโครงสร้างตาราง
    if ActiveNoSpread then
        if config.fire then
            config.fire.spreadFactor = 0
            config.fire.aimingSpreadFactor = 0
        end
    else
        if orig and config.fire then
            if orig.spreadFactor ~= nil then config.fire.spreadFactor = orig.spreadFactor end
            if orig.aimingSpreadFactor ~= nil then config.fire.aimingSpreadFactor = orig.aimingSpreadFactor end
        end
    end

    -- 3. Rapid Fire: ยิงรัวแบบปลอดภัย ไม่หลุด Sync ของ Server
    if ActiveRapidFire then
        if config.fire then
            config.fire.fireDelay = 0.06
            config.fire.burstDelay = 0.04
            if config.fire.boltDelay ~= nil then config.fire.boltDelay = 0 end
        end
    else
        if orig and config.fire then
            if orig.fireDelay ~= nil then config.fire.fireDelay = orig.fireDelay end
            if orig.burstDelay ~= nil then config.fire.burstDelay = orig.burstDelay end
            if orig.boltDelay ~= nil then config.fire.boltDelay = orig.boltDelay end
        end
    end

    -- 4. Infinite Ammo: กระสุนไม่จำกัด
    if ActiveInfiniteAmmo then
        if config.ammo then
            config.ammo.infAmmo = true
        end
    else
        if orig and config.ammo then
            if orig.infAmmo ~= nil then config.ammo.infAmmo = orig.infAmmo end
        end
    end
end

local function applyModsToItem(item)
    local config = findWeaponConfig(item)
    if config then
        applyModsToConfig(config)
    end
end


local function ApplyWeaponModsToAll()
    local localPlayer = Players.LocalPlayer
    if not localPlayer then return end

    -- ตรวจสอบอาวุธที่กำลังถือใน Character
    if localPlayer.Character then
        for _, item in ipairs(localPlayer.Character:GetChildren()) do
            applyModsToItem(item)
        end
    end

    -- ตรวจสอบอาวุธในช่องเก็บของ Backpack
    local backpack = localPlayer:FindFirstChild("Backpack")
    if backpack then
        for _, item in ipairs(backpack:GetChildren()) do
            applyModsToItem(item)
        end
    end
end

local function setupWeaponMonitoring()
    local localPlayer = Players.LocalPlayer
    if not localPlayer then return end

    local function attachListeners(char)
        if not char then return end

        if weaponListeners.charChildAdded then
            pcall(function() weaponListeners.charChildAdded:Disconnect() end)
        end

        weaponListeners.charChildAdded = char.ChildAdded:Connect(function(item)
            task.wait(0.1)
            applyModsToItem(item)
        end)

        local backpack = localPlayer:FindFirstChild("Backpack")
        if backpack then
            if weaponListeners.backpackChildAdded then
                pcall(function() weaponListeners.backpackChildAdded:Disconnect() end)
            end
            weaponListeners.backpackChildAdded = backpack.ChildAdded:Connect(function(item)
                task.wait(0.1)
                applyModsToItem(item)
            end)
        end

        ApplyWeaponModsToAll()
    end

    if localPlayer.Character then
        attachListeners(localPlayer.Character)
    end

    if weaponListeners.charAdded then
        pcall(function() weaponListeners.charAdded:Disconnect() end)
    end

    weaponListeners.charAdded = localPlayer.CharacterAdded:Connect(function(char)
        task.wait(0.5)
        attachListeners(char)
    end)
end

-- เริ่มการทำงานของระบบตรวจจับอาวุธและลูปตรวจสอบอัตโนมัติ
setupWeaponMonitoring()

task.spawn(function()
    while true do
        task.wait(1.5)
        if ActiveNoRecoil or ActiveNoSpread or ActiveRapidFire or ActiveInfiniteAmmo then
            ApplyWeaponModsToAll()
        end
    end
end)

-- [[ COMBAT TAB PANELS ]] --
local CombatPanel = Tabs.Combat:AddPanel("Combat Features")

CombatPanel:AddToggle({
    Title = "Head Hitbox Mobs",
    Description = "ขยายขนาดหัวมอนสเตอร์เป็นขนาด 5 เพื่อให้โจมตีง่ายขึ้น",
    Default = false,
    Callback = function(Value)
        ActiveHeadHitbox = Value
        if ActiveHeadHitbox then
            local charactersFolder = Workspace:FindFirstChild("Characters")
            if charactersFolder then
                for _, mob in pairs(charactersFolder:GetChildren()) do
                    ApplyHeadHitbox(mob)
                end
            end
            UpdateMobConnections()
        else
            local charactersFolder = Workspace:FindFirstChild("Characters")
            if charactersFolder then
                for _, mob in pairs(charactersFolder:GetChildren()) do
                    ResetHeadHitbox(mob)
                end
            end
            UpdateMobConnections()
        end
    end
})

local WeaponPanel = Tabs.Combat:AddPanel("Weapon Modifications")

WeaponPanel:AddToggle({
    Title = "No Recoil",
    Description = "ห้ามใช้งานไม่งันบัค | Do not use this function.",
    Default = false,
    Callback = function(Value)
        ActiveNoRecoil = Value
        ApplyWeaponModsToAll()
    end
})

WeaponPanel:AddToggle({
    Title = "No Spread",
    Description = "ห้ามใช้งานไม่งันบัค | Do not use this function.",
    Default = false,
    Callback = function(Value)
        ActiveNoSpread = Value
        ApplyWeaponModsToAll()
    end
})

WeaponPanel:AddToggle({
    Title = "Rapid Fire",
    Description = "ห้ามใช้งานไม่งันบัค | Do not use this function.",
    Default = false,
    Callback = function(Value)
        ActiveRapidFire = Value
        ApplyWeaponModsToAll()
    end
})

WeaponPanel:AddToggle({
    Title = "Infinite Ammo",
    Description = "ห้ามใช้งานไม่งันบัค | Do not use this function.",
    Default = false,
    Callback = function(Value)
        ActiveInfiniteAmmo = Value
        ApplyWeaponModsToAll()
    end
})

-- [[ PLAYER TAB PANELS ]] --
local PlayerPanel = Tabs.Main:AddPanel("Player Controls")

local InfiniteStamina = false
local staminaConnection = nil
local charAddedConnection = nil

local function setupStamina(char)
    if not InfiniteStamina then return end

    local client = char:WaitForChild("ClientHandler", 3) or char:WaitForChild("Client", 2)
    local stateModule = (client and (client:WaitForChild("State", 3) or client:FindFirstChild("State"))) or char:FindFirstChild("State", true)
    if not stateModule then return end
    
    local success, State = pcall(require, stateModule)
    if not success or not State or not State.stamina then return end

    if staminaConnection then
        staminaConnection:Disconnect()
        staminaConnection = nil
    end

    staminaConnection = RunService.Heartbeat:Connect(function()
        if InfiniteStamina and State.stamina then
            State.stamina.current = 200
            State.stamina.fullRegen = false
            State.stamina.regenDelay = 0
        end
    end)
end

local function disableStamina()
    if staminaConnection then
        staminaConnection:Disconnect()
        staminaConnection = nil
    end
    if charAddedConnection then
        charAddedConnection:Disconnect()
        charAddedConnection = nil
    end
end

PlayerPanel:AddToggle({
    Title = "Infinite Stamina",
    Description = "ล็อกค่าสเตมิน่า (Stamina) ของผู้เล่นให้เต็ม 200 ตลอดเวลา",
    Default = false,
    Callback = function(Value)
        InfiniteStamina = Value
        if InfiniteStamina then
            local localPlayer = Players.LocalPlayer
            if localPlayer.Character then
                task.spawn(setupStamina, localPlayer.Character)
            end
            charAddedConnection = localPlayer.CharacterAdded:Connect(function(char)
                task.wait(0.5)
                if InfiniteStamina then
                    setupStamina(char)
                end
            end)
        else
            disableStamina()
        end
    end
})

local localPlayer = Players.LocalPlayer
local ActiveCFrameSpeed = false
local cframeSpeedValue = 0.05
local cframeConnection = nil

PlayerPanel:AddToggle({
    Title = "CFrame Speed",
    Description = "เปิดระบบเดินเร็ว (CFrame Hack)",
    Default = false,
    Callback = function(Value)
        ActiveCFrameSpeed = Value
        if cframeConnection then
            cframeConnection:Disconnect()
            cframeConnection = nil
        end
        if ActiveCFrameSpeed then
            cframeConnection = RunService.RenderStepped:Connect(function(dt)
                local char = localPlayer.Character
                local root = char and char:FindFirstChild("HumanoidRootPart")
                local hum = char and char:FindFirstChildOfClass("Humanoid")
                if root and hum and hum.MoveDirection.Magnitude > 0 then
                    root.CFrame = root.CFrame + (hum.MoveDirection * (cframeSpeedValue * 20 * dt))
                end
            end)
        end
    end
})

PlayerPanel:AddSlider({
    Title = "Speed Multiplier",
    Description = "ปรับความเร็วแบบละเอียด (0.01 - 3.00)",
    Min = 0.01,
    Max = 3,
    Default = 0.05,
    Rounding = 2,
    Callback = function(Value)
        cframeSpeedValue = Value
    end
})

-- [[ TELEPORT LOGIC & PANELS ]] --
local function teleportTo(vector)
    local localPlayer = Players.LocalPlayer
    local char = localPlayer.Character
    local hrp = char and char:FindFirstChild("HumanoidRootPart")
    if hrp then
        hrp.CFrame = CFrame.new(vector)
    else
        warn("HumanoidRootPart not found for teleport!")
    end
end

local TeleportPanel1 = Tabs.Teleport:AddPanel("Sector 1")
TeleportPanel1:AddButton({
    Title = "Spawn",
    Description = "วาร์ปไป Spawn",
    Callback = function() teleportTo(Vector3.new(-55, -33, -1410)) end
})
TeleportPanel1:AddButton({
    Title = "Generator 1",
    Description = "วาร์ปไป Generator 1",
    Callback = function() teleportTo(Vector3.new(135, -30, -1225)) end
})
TeleportPanel1:AddButton({
    Title = "Reactor 4",
    Description = "วาร์ปไป Reactor 4",
    Callback = function() teleportTo(Vector3.new(-230, -30, -1428)) end
})
TeleportPanel1:AddButton({
    Title = "Mutant",
    Description = "วาร์ปไปจุดเกิด Mutant",
    Callback = function() teleportTo(Vector3.new(-155, -33, -1565)) end
})
TeleportPanel1:AddButton({
    Title = "Valve",
    Description = "วาร์ปไป Valve",
    Callback = function() teleportTo(Vector3.new(-225, -35, -1635)) end
})
TeleportPanel1:AddButton({
    Title = "Generator 2",
    Description = "วาร์ปไป Generator 2",
    Callback = function() teleportTo(Vector3.new(-140, -30, -1145)) end
})

local TeleportPanel2 = Tabs.Teleport:AddPanel("Sector 2")
TeleportPanel2:AddButton({
    Title = "Sector Entrance",
    Description = "วาร์ปไป Sector Entrance",
    Callback = function() teleportTo(Vector3.new(-110, -10, -825)) end
})
TeleportPanel2:AddButton({
    Title = "Russman Office",
    Description = "วาร์ปไป Russman Office",
    Callback = function() teleportTo(Vector3.new(38, -10, -917)) end
})
TeleportPanel2:AddButton({
    Title = "Armory",
    Description = "วาร์ปไป Armory",
    Callback = function() teleportTo(Vector3.new(-45, -10, -894)) end
})
TeleportPanel2:AddButton({
    Title = "Keycard",
    Description = "วาร์ปไป Keycard",
    Callback = function() teleportTo(Vector3.new(50, -10, -1054)) end
})
TeleportPanel2:AddButton({
    Title = "Steve",
    Description = "วาร์ปไป Steve",
    Callback = function() teleportTo(Vector3.new(-30, 0, -1058)) end
})

local TeleportPanel3 = Tabs.Teleport:AddPanel("Sector 3")
TeleportPanel3:AddButton({
    Title = "Sector Entrance",
    Description = "วาร์ปไป Sector Entrance",
    Callback = function() teleportTo(Vector3.new(208, -31, -1171)) end
})
TeleportPanel3:AddButton({
    Title = "Crate 1-3",
    Description = "วาร์ปไป Crate 1-3",
    Callback = function() teleportTo(Vector3.new(289, -31, -1216)) end
})
TeleportPanel3:AddButton({
    Title = "Crate 4",
    Description = "วาร์ปไป Crate 4",
    Callback = function() teleportTo(Vector3.new(676, -31, -1342)) end
})
TeleportPanel3:AddButton({
    Title = "Crate 5",
    Description = "วาร์ปไป Crate 5",
    Callback = function() teleportTo(Vector3.new(597, -49, -1395)) end
})
TeleportPanel3:AddButton({
    Title = "Crate 6",
    Description = "วาร์ปไป Crate 6",
    Callback = function() teleportTo(Vector3.new(471, -50, -1293)) end
})
TeleportPanel3:AddButton({
    Title = "C4 1",
    Description = "วาร์ปไป C4 1",
    Callback = function() teleportTo(Vector3.new(462, -31, -1004)) end
})
TeleportPanel3:AddButton({
    Title = "C4 2",
    Description = "วาร์ปไป C4 2",
    Callback = function() teleportTo(Vector3.new(349, -31, -817)) end
})
TeleportPanel3:AddButton({
    Title = "C4 3",
    Description = "วาร์ปไป C4 3",
    Callback = function() teleportTo(Vector3.new(636, -31, -754)) end
})
TeleportPanel3:AddButton({
    Title = "C4 4",
    Description = "วาร์ปไป C4 4",
    Callback = function() teleportTo(Vector3.new(843, -18, -1060)) end
})
TeleportPanel3:AddButton({
    Title = "Keycard",
    Description = "วาร์ปไป Keycard",
    Callback = function() teleportTo(Vector3.new(774, -31, -857)) end
})

local TeleportPanel4 = Tabs.Teleport:AddPanel("Out of Map")
TeleportPanel4:AddButton({
    Title = "Baseplate",
    Description = "วาร์ปไป Baseplate",
    Callback = function() teleportTo(Vector3.new(-200, -2, -75)) end
})

TeleportPanel4:AddButton({
    Title = "Special Weapon",
    Description = "วาร์ปไปเอาปืนพิเศษ",
    Callback = function() teleportTo(Vector3.new(55.33, 23.72, -1706.85)) end
})


OSX:Notify({
    Title = "OSX HUB",
    Content = GameName .. " script ready!",
    Type = "Success"
})

